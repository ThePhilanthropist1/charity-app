import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUsersByRole, deleteUser, logAdminAction, getAdminAuditLogs } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
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

    // Verify admin role (would need to check user.role from DB)
    const admin = await getUser(userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { role, action } = Object.fromEntries(request.nextUrl.searchParams);

    if (action === 'users_by_role') {
      const users = await getUsersByRole(role || 'beneficiary');
      return NextResponse.json<ApiResponse<typeof users>>(
        { success: true, data: users },
        { status: 200 }
      );
    } else if (action === 'audit_logs') {
      const logs = await getAdminAuditLogs(userId, 100);
      return NextResponse.json<ApiResponse<typeof logs>>(
        { success: true, data: logs },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Admin GET error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Verify admin role
    const admin = await getUser(userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { target_user_id, reason } = await request.json();

    if (!target_user_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Target user ID required' },
        { status: 400 }
      );
    }

    // Delete user
    const deleted = await deleteUser(target_user_id);

    if (!deleted) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction({
      admin_user_id: userId,
      action_type: 'account_deleted',
      target_user_id,
      details: { reason: reason || 'No reason provided' },
    });

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, data: { message: 'User deleted successfully' } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Admin DELETE error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
