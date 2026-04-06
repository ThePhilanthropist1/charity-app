import { NextRequest, NextResponse } from 'next/server';
import { createBeneficiaryActivation, getBeneficiaryActivation } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const YOUR_WALLET = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e'.toLowerCase();
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
const MIN_USDT_AMOUNT = 0.9;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_API_BASE = 'https://api.minepi.com';
const MAX_BENEFICIARIES = 1_000_000;

const BSC_RPCS = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
];

// ── Cap check ─────────────────────────────────────────────────────────────────
async function isBeneficiaryCapReached(): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/db');
    const { count } = await supabase
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    return (count ?? 0) >= MAX_BENEFICIARIES;
  } catch {
    return false;
  }
}

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
    return { success: false, error: 'Pi API unreachable' };
  }
}

// ── BSC RPC ───────────────────────────────────────────────────────────────────

async function rpcCall(method: string, params: any[]): Promise<any> {
  for (const rpc of BSC_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      const data = await res.json();
      if (data.result !== undefined) return data.result;
    } catch (e) {
      console.error(`RPC ${rpc} failed:`, e);
    }
  }
  return null;
}

async function verifyViaRPC(txHash: string): Promise<{ valid: boolean; error?: string; amount?: number; from?: string }> {
  try {
    const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
    if (!receipt) return { valid: false, error: 'Transaction not found on blockchain. Please check the hash is correct and the transaction is confirmed.' };
    if (receipt.status !== '0x1') return { valid: false, error: 'This transaction failed on the blockchain. Please use a successful transaction.' };

    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const logs: any[] = receipt.logs || [];

    for (const log of logs) {
      const logAddress = log.address?.toLowerCase();
      const topic0 = log.topics?.[0]?.toLowerCase();
      if (logAddress === USDT_CONTRACT && topic0 === TRANSFER_TOPIC && log.topics?.length >= 3) {
        const toAddress = ('0x' + log.topics[2].slice(26)).toLowerCase();
        if (toAddress === YOUR_WALLET) {
          const fromAddress = ('0x' + log.topics[1].slice(26)).toLowerCase();
          const rawBig = BigInt(log.data);
          let amount = Number(rawBig) / 1e18;
          if (amount < 0.000001) amount = Number(rawBig) / 1e6;
          if (amount < MIN_USDT_AMOUNT) return { valid: false, error: `Insufficient amount: ${amount.toFixed(4)} USDT sent. Minimum required: 1 USDT.` };
          return { valid: true, amount, from: fromAddress };
        }
      }
    }
    return { valid: false, error: 'No USDT transfer to our wallet found in this transaction. Please ensure you sent USDT (BEP20) to: ' + YOUR_WALLET };
  } catch (err: any) {
    return { valid: false, error: 'Blockchain verification failed. Please try again.' };
  }
}

async function verifyViaBSCScan(txHash: string): Promise<{ valid: boolean; error?: string; amount?: number; from?: string }> {
  try {
    const receiptRes = await fetch(`https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`);
    const receiptData = await receiptRes.json();
    if (receiptData.status === '0' || !receiptData.result?.status) return verifyViaRPC(txHash);
    if (receiptData.result.status !== '1') return { valid: false, error: 'Transaction failed or not yet confirmed. Please wait a few minutes and try again.' };

    const transferRes = await fetch(`https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${YOUR_WALLET}&page=1&offset=10&apikey=${BSCSCAN_API_KEY}`);
    const transferData = await transferRes.json();
    if (!transferData.result || transferData.result.length === 0) return verifyViaRPC(txHash);

    const relevantTransfer = transferData.result.find((tx: any) =>
      tx.hash?.toLowerCase() === txHash.toLowerCase() &&
      tx.to?.toLowerCase() === YOUR_WALLET &&
      tx.contractAddress?.toLowerCase() === USDT_CONTRACT
    );
    if (!relevantTransfer) return verifyViaRPC(txHash);

    const decimals = parseInt(relevantTransfer.tokenDecimal || '18');
    const amount = parseFloat(relevantTransfer.value) / Math.pow(10, decimals);
    if (amount < MIN_USDT_AMOUNT) return { valid: false, error: `Insufficient amount: ${amount.toFixed(4)} USDT sent. Minimum required: 1 USDT.` };
    return { valid: true, amount, from: relevantTransfer.from };
  } catch (err) {
    return verifyViaRPC(txHash);
  }
}

async function verifyBSCTransaction(txHash: string): Promise<{ valid: boolean; error?: string; amount?: number; from?: string }> {
  if (!BSCSCAN_API_KEY) return verifyViaRPC(txHash);
  return verifyViaBSCScan(txHash);
}

// ── Main route handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);
    if (!valid) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { action, transaction_hash, payment_id, txid, amount_pi } = await request.json();

    // Check if already activated
    const existingActivation = await getBeneficiaryActivation(userId);
    if (existingActivation?.payment_status === 'verified') {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Account is already activated' }, { status: 409 });
    }

    // ── CAP CHECK — block activation when 1M reached ──────────────────────────
    // Skip cap check for approve_pi (no slot consumed yet at approval stage)
    if (action !== 'approve_pi') {
      const capReached = await isBeneficiaryCapReached();
      if (capReached) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: 'Activation is now closed. All 1,000,000 beneficiary slots have been filled. Thank you for your interest in the Charity Token Project.',
          },
          { status: 403 }
        );
      }
    }

    // ── PI: APPROVE ──
    if (action === 'approve_pi') {
      if (!payment_id) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Payment ID required' }, { status: 400 });
      const approval = await approvePiPayment(payment_id);
      if (!approval.success) return NextResponse.json<ApiResponse<null>>({ success: false, error: approval.error || 'Payment approval failed' }, { status: 400 });
      return NextResponse.json<ApiResponse<{ approved: boolean }>>({ success: true, data: { approved: true } }, { status: 200 });
    }

    // ── PI: COMPLETE ──
    if (action === 'pi_payment') {
      if (!payment_id || !txid || !amount_pi) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Missing payment details' }, { status: 400 });
      const completion = await completePiPayment(payment_id, txid);
      if (!completion.success) console.warn('Pi completion API failed but activating anyway:', txid);
      const activation = await createBeneficiaryActivation({
        user_id: userId, activation_method: 'pi_payment',
        payment_status: 'verified', transaction_hash: txid,
        activated_at: new Date().toISOString(),
      });
      if (!activation) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to create activation record' }, { status: 500 });
      return NextResponse.json<ApiResponse<typeof activation>>({ success: true, data: activation }, { status: 201 });
    }

    // ── WALLET TRANSFER ──
    if (action === 'wallet_transfer') {
      if (!transaction_hash) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Transaction hash is required' }, { status: 400 });

      const cleanHash = transaction_hash.trim().toLowerCase();
      if (!/^0x[a-f0-9]{64}$/.test(cleanHash)) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid transaction hash format. It must start with 0x followed by exactly 64 characters.' }, { status: 400 });
      }

      const { supabase } = await import('@/lib/db');
      const { data: existingTx } = await (supabase as any).from('beneficiary_activations').select('id').eq('transaction_hash', cleanHash).maybeSingle();
      if (existingTx) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'This transaction has already been used to activate another account.' }, { status: 409 });

      const verification = await verifyBSCTransaction(cleanHash);
      if (!verification.valid) return NextResponse.json<ApiResponse<null>>({ success: false, error: verification.error || 'Transaction could not be verified.' }, { status: 400 });

      const activation = await createBeneficiaryActivation({
        user_id: userId, activation_method: 'wallet_transfer',
        payment_status: 'verified', transaction_hash: cleanHash,
        activated_at: new Date().toISOString(),
      });
      if (!activation) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to save activation. Please contact support.' }, { status: 500 });
      return NextResponse.json<ApiResponse<{ activation: typeof activation; amount: number }>>({ success: true, data: { activation, amount: verification.amount || 0 } }, { status: 201 });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid activation method' }, { status: 400 });

  } catch (error) {
    console.error('[activation] Unhandled error:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}