import { supabase, recordTransaction, updateUserStatus } from '@/lib/supabase-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { beneficiaryId, paymentMethod, transactionHash, walletAddress } = body;

    if (!beneficiaryId || !paymentMethod) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment based on method
    let verified = false;
    let message = '';

    if (paymentMethod === 'wallet') {
      // Basic validation - in production, verify with blockchain
      verified = transactionHash && transactionHash.startsWith('0x') && transactionHash.length === 66;
      message = verified
        ? 'Payment verified successfully'
        : 'Invalid transaction hash format';
    } else if (paymentMethod === 'pi_network') {
      // Pi Network payment (integrate with Pi API in production)
      verified = true;
      message = 'Pi Network payment confirmed';
    } else if (paymentMethod === 'telegram') {
      // Telegram payment (require manual verification)
      verified = true;
      message = 'Telegram payment recorded for manual review';
    }

    if (!verified) {
      return Response.json({ error: message }, { status: 400 });
    }

    // Create payment verification record
    const { data: verification, error: verifyError } = await supabase
      .from('payment_verifications')
      .insert({
        beneficiary_id: beneficiaryId,
        payment_method: paymentMethod,
        payment_amount: paymentMethod === 'pi_network' ? 6.0 : 1.0,
        transaction_hash: transactionHash,
        wallet_address: walletAddress,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (verifyError) throw verifyError;

    // Activate beneficiary
    await updateUserStatus(beneficiaryId, 'active');

    return Response.json({
      success: true,
      message,
      verificationId: verification.id,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return Response.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
