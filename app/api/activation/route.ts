import { NextRequest, NextResponse } from 'next/server';
import { createBeneficiaryActivation, getBeneficiaryActivation } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const YOUR_WALLET = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e'.toLowerCase();
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
const MIN_USDT_AMOUNT = 1.0;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';
const PI_API_KEY = process.env.PI_API_KEY || '4p78ymix57zoansuygpf7ukrlyaswxuzpzpekrpvesd0clg9nh0bensvob5hx9uv';
const PI_API_BASE = 'https://api.minepi.com';

// BSC RPC endpoint — no API key needed, always available
const BSC_RPC = 'https://bsc-dataseed1.binance.org/';

// ── Pi helpers ────────────────────────────────────────────────────────────────

async function approvePiPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err?.error_message || 'Pi approval failed' };
    }
    return { success: true };
  } catch (e) {
    console.error('Pi approval error:', e);
    return { success: false, error: 'Pi API unreachable' };
  }
}

async function completePiPayment(paymentId: string, txid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err?.error_message || 'Pi completion failed' };
    }
    return { success: true };
  } catch (e) {
    console.error('Pi completion error:', e);
    return { success: false, error: 'Pi API unreachable' };
  }
}

// ── BSC RPC verification (no API key needed) ──────────────────────────────────

async function rpcCall(method: string, params: any[]): Promise<any> {
  const res = await fetch(BSC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  return data.result;
}

async function verifyBSCTransactionViaRPC(txHash: string): Promise<{
  valid: boolean; error?: string; amount?: number; from?: string;
}> {
  try {
    // Get transaction receipt via RPC
    const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);

    if (!receipt) {
      return { valid: false, error: 'Transaction not found. Please check the hash and ensure the transaction is confirmed.' };
    }

    if (receipt.status !== '0x1') {
      return { valid: false, error: 'Transaction failed on the blockchain. Please use a successful transaction.' };
    }

    // USDT Transfer event topic: Transfer(address,address,uint256)
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    // Find a Transfer log from the USDT contract going to our wallet
    const logs = receipt.logs || [];
    let transferAmount: number | null = null;
    let fromAddress: string | null = null;

    for (const log of logs) {
      if (
        log.address?.toLowerCase() === USDT_CONTRACT &&
        log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
        log.topics?.length >= 3
      ) {
        // topics[2] = to address (padded to 32 bytes)
        const toAddress = '0x' + log.topics[2].slice(26).toLowerCase();

        if (toAddress === YOUR_WALLET) {
          // data = amount in hex
          const rawAmount = BigInt(log.data);
          // USDT on BSC has 18 decimals
          const amount = Number(rawAmount) / 1e18;
          fromAddress = '0x' + log.topics[1].slice(26).toLowerCase();
          transferAmount = amount;
          break;
        }
      }
    }

    if (transferAmount === null) {
      return {
        valid: false,
        error: 'No USDT transfer to our wallet found in this transaction. Please ensure you sent USDT (BEP20) to the correct wallet address.',
      };
    }

    if (transferAmount < MIN_USDT_AMOUNT) {
      return {
        valid: false,
        error: `Insufficient amount sent: ${transferAmount.toFixed(4)} USDT. Required: ${MIN_USDT_AMOUNT} USDT minimum.`,
      };
    }

    return { valid: true, amount: transferAmount, from: fromAddress || undefined };

  } catch (err: any) {
    console.error('RPC verification error:', err);
    return { valid: false, error: 'Blockchain verification failed. Please try again in a moment.' };
  }
}

// ── BSCScan verification (uses API key, more detailed) ────────────────────────

async function verifyBSCTransactionViaScan(txHash: string): Promise<{
  valid: boolean; error?: string; amount?: number; from?: string;
}> {
  try {
    // Check receipt status
    const receiptRes = await fetch(
      `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`
    );
    const receiptData = await receiptRes.json();

    // If API key is missing or rate limited, fall back to RPC
    if (receiptData.status === '0' && receiptData.message?.includes('rate limit')) {
      console.log('BSCScan rate limited, falling back to RPC...');
      return verifyBSCTransactionViaRPC(txHash);
    }

    if (receiptData.result?.status !== '1') {
      return { valid: false, error: 'Transaction failed or not yet confirmed. Please wait a few minutes and try again.' };
    }

    // Get token transfer events
    const transferRes = await fetch(
      `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${YOUR_WALLET}&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`
    );
    const transferData = await transferRes.json();

    if (!transferData.result || transferData.result.length === 0) {
      // Fall back to RPC which reads logs directly
      return verifyBSCTransactionViaRPC(txHash);
    }

    const relevantTransfer = transferData.result.find((tx: any) =>
      tx.to?.toLowerCase() === YOUR_WALLET &&
      tx.contractAddress?.toLowerCase() === USDT_CONTRACT
    );

    if (!relevantTransfer) {
      return {
        valid: false,
        error: 'No USDT transfer to our wallet found in this transaction. Please check you sent to the correct address.',
      };
    }

    const decimals = parseInt(relevantTransfer.tokenDecimal || '18');
    const amount = parseFloat(relevantTransfer.value) / Math.pow(10, decimals);

    if (amount < MIN_USDT_AMOUNT) {
      return {
        valid: false,
        error: `Insufficient amount. Sent: ${amount.toFixed(2)} USDT. Required: ${MIN_USDT_AMOUNT} USDT.`,
      };
    }

    return { valid: true, amount, from: relevantTransfer.from };

  } catch (err) {
    console.error('BSCScan error, falling back to RPC:', err);
    return verifyBSCTransactionViaRPC(txHash);
  }
}

// Main verifier — tries BSCScan first, falls back to RPC
async function verifyBSCTransaction(txHash: string): Promise<{
  valid: boolean; error?: string; amount?: number; from?: string;
}> {
  // If no API key, go straight to RPC
  if (!BSCSCAN_API_KEY) {
    console.log('No BSCScan API key, using RPC directly...');
    return verifyBSCTransactionViaRPC(txHash);
  }
  return verifyBSCTransactionViaScan(txHash);
}

// ── Main route handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' }, { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);
    if (!valid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid token' }, { status: 401 }
      );
    }

    const { action, transaction_hash, payment_id, txid, amount_pi } = await request.json();

    // Check if already activated
    const existingActivation = await getBeneficiaryActivation(userId);
    if (existingActivation?.payment_status === 'verified') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Account is already activated' }, { status: 409 }
      );
    }

    // ── PI: APPROVE ──
    if (action === 'approve_pi') {
      if (!payment_id) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Payment ID required' }, { status: 400 }
        );
      }
      const approval = await approvePiPayment(payment_id);
      if (!approval.success) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: approval.error || 'Payment approval failed' }, { status: 400 }
        );
      }
      return NextResponse.json<ApiResponse<{ approved: boolean }>>(
        { success: true, data: { approved: true } }, { status: 200 }
      );
    }

    // ── PI: COMPLETE ──
    if (action === 'pi_payment') {
      if (!payment_id || !txid || !amount_pi) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing payment details' }, { status: 400 }
        );
      }
      const completion = await completePiPayment(payment_id, txid);
      if (!completion.success) {
        console.warn('Pi completion API failed but activating anyway:', txid);
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
          { success: false, error: 'Failed to create activation record' }, { status: 500 }
        );
      }
      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation }, { status: 201 }
      );
    }

    // ── WALLET TRANSFER ──
    if (action === 'wallet_transfer') {
      if (!transaction_hash) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Transaction hash is required' }, { status: 400 }
        );
      }

      const cleanHash = transaction_hash.trim().toLowerCase();

      // Validate format
      if (!/^0x[a-f0-9]{64}$/.test(cleanHash)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid transaction hash format. It must start with 0x followed by exactly 64 characters.' },
          { status: 400 }
        );
      }

      // Check hash not already used (one-time use enforcement)
      const { supabase } = await import('@/lib/db');
      const { data: existingTx } = await (supabase as any)
        .from('beneficiary_activations')
        .select('id, user_id')
        .eq('transaction_hash', cleanHash)
        .maybeSingle();

      if (existingTx) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'This transaction has already been used to activate an account. Each transaction can only be used once.' },
          { status: 409 }
        );
      }

      // Verify on blockchain (BSCScan + RPC fallback)
      const verification = await verifyBSCTransaction(cleanHash);

      if (!verification.valid) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: verification.error || 'Transaction could not be verified on the blockchain.' },
          { status: 400 }
        );
      }

      // All good — activate account
      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'wallet_transfer',
        payment_status: 'verified',
        transaction_hash: cleanHash,
        activated_at: new Date().toISOString(),
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to save activation. Please contact support.' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<{ activation: typeof activation; amount: number }>>(
        { success: true, data: { activation, amount: verification.amount || 0 } },
        { status: 201 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid activation method' }, { status: 400 }
    );

  } catch (error) {
    console.error('[activation] Unhandled error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}