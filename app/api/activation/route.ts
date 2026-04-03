import { NextRequest, NextResponse } from 'next/server';
import { createBeneficiaryActivation, getBeneficiaryActivation } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const YOUR_WALLET = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e'.toLowerCase();
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
const MIN_USDT_AMOUNT = 1.0;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';

async function verifyBSCTransaction(txHash: string): Promise<{
  valid: boolean;
  error?: string;
  amount?: number;
  from?: string;
}> {
  try {
    // 1. Get transaction receipt to confirm it succeeded
    const receiptRes = await fetch(
      'https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus' +
      '&txhash=' + txHash +
      '&apikey=' + BSCSCAN_API_KEY
    );
    const receiptData = await receiptRes.json();

    if (receiptData.result?.status !== '1') {
      return { valid: false, error: 'Transaction failed or not confirmed on blockchain' };
    }

    // 2. Get BEP20 token transfer events for this tx
    const transferRes = await fetch(
      'https://api.bscscan.com/api?module=account&action=tokentx' +
      '&contractaddress=' + USDT_CONTRACT +
      '&txhash=' + txHash +
      '&apikey=' + BSCSCAN_API_KEY
    );
    const transferData = await transferRes.json();

    if (!transferData.result || transferData.result.length === 0) {
      // Try getting by hash directly via token transfer logs
      const logsRes = await fetch(
        'https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash' +
        '&txhash=' + txHash +
        '&apikey=' + BSCSCAN_API_KEY
      );
      const logsData = await logsRes.json();

      if (!logsData.result) {
        return { valid: false, error: 'Transaction not found on BSC blockchain' };
      }

      // Check if it goes to USDT contract
      const toAddress = logsData.result.to?.toLowerCase();
      if (toAddress !== USDT_CONTRACT) {
        return { valid: false, error: 'Transaction is not a USDT BEP20 transfer' };
      }

      return { valid: false, error: 'Could not verify USDT transfer details. Please wait for more confirmations.' };
    }

    // 3. Find the transfer that goes to our wallet
    const relevantTransfer = transferData.result.find((tx: any) => {
      return (
        tx.to?.toLowerCase() === YOUR_WALLET &&
        tx.contractAddress?.toLowerCase() === USDT_CONTRACT
      );
    });

    if (!relevantTransfer) {
      return {
        valid: false,
        error: 'No USDT transfer to our wallet found in this transaction. Please check the transaction hash.',
      };
    }

    // 4. Verify amount (USDT has 18 decimals on BSC)
    const decimals = parseInt(relevantTransfer.tokenDecimal || '18');
    const amount = parseFloat(relevantTransfer.value) / Math.pow(10, decimals);

    if (amount < MIN_USDT_AMOUNT) {
      return {
        valid: false,
        error: 'Insufficient amount. Sent: ' + amount.toFixed(2) + ' USDT. Required: ' + MIN_USDT_AMOUNT + ' USDT.',
      };
    }

    return {
      valid: true,
      amount,
      from: relevantTransfer.from,
    };
  } catch (err) {
    console.error('BSC verification error:', err);
    return { valid: false, error: 'Blockchain verification failed. Please try again.' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);

    if (!valid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const {
      action,
      activation_method,
      transaction_hash,
      philanthropist_username,
      payment_id,
      txid,
      amount_pi,
    } = await request.json();

    // Check if user already activated
    const existingActivation = await getBeneficiaryActivation(userId);
    if (existingActivation?.payment_status === 'verified') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Account is already activated' },
        { status: 409 }
      );
    }

    if (action === 'pi_payment') {
      if (!payment_id || !txid || !amount_pi) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing payment details' },
          { status: 400 }
        );
      }

      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'pi_payment',
        payment_status: 'verified',
        transaction_hash: txid,
        activated_at: new Date().toISOString(),
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation },
        { status: 201 }
      );

    } else if (action === 'wallet_transfer') {
      if (!transaction_hash) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Transaction hash required' },
          { status: 400 }
        );
      }

      // Validate tx hash format
      const cleanHash = transaction_hash.trim();
      if (!/^0x[a-fA-F0-9]{64}$/.test(cleanHash)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid transaction hash format. It should start with 0x followed by 64 characters.' },
          { status: 400 }
        );
      }

      // Check if this tx hash was already used
      const { supabase } = await import('@/lib/db');
      const { data: existingTx } = await (supabase as any)
        .from('beneficiary_activations')
        .select('id')
        .eq('transaction_hash', cleanHash)
        .single();

      if (existingTx) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'This transaction hash has already been used for another account.' },
          { status: 409 }
        );
      }

      // Verify on BSC blockchain
      const verification = await verifyBSCTransaction(cleanHash);

      if (!verification.valid) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: verification.error || 'Transaction verification failed' },
          { status: 400 }
        );
      }

      // All checks passed - activate account
      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'wallet_transfer',
        payment_status: 'verified',
        transaction_hash: cleanHash,
        activated_at: new Date().toISOString(),
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation record' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<{ activation: typeof activation; amount: number }>>(
        {
          success: true,
          data: { activation, amount: verification.amount || 0 },
        },
        { status: 201 }
      );

    } else if (action === 'philanthropist') {
      if (!philanthropist_username) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Philanthropist username required' },
          { status: 400 }
        );
      }

      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'philanthropist',
        payment_status: 'pending',
        philanthropist_username,
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation },
        { status: 201 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid activation method' },
          { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Activation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
