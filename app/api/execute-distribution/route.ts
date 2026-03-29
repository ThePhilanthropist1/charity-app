import { executeMonthlyDistribution, logAdminAction } from '@/lib/supabase-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { distributionId, adminId } = body;

    if (!distributionId || !adminId) {
      return Response.json(
        { error: 'Missing distributionId or adminId' },
        { status: 400 }
      );
    }

    // Execute distribution
    await executeMonthlyDistribution(distributionId);

    // Log admin action
    await logAdminAction(adminId, 'distribution_executed', undefined, {
      distributionId,
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: 'Distribution executed successfully',
      distributionId,
    });
  } catch (error: any) {
    console.error('Distribution execution error:', error);
    return Response.json(
      { error: error.message || 'Distribution execution failed' },
      { status: 500 }
    );
  }
}
