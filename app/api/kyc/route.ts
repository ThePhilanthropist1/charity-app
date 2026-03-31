import { NextRequest, NextResponse } from 'next/server';
import { createKYCSubmission, getKYCSubmission, getPendingKYCSubmissions, approveKYCSubmission, rejectKYCSubmission } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

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

    const { action, government_id_type, government_id_url, face_capture_url } = await request.json();

    if (action === 'submit') {
      if (!government_id_type || !government_id_url || !face_capture_url) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check if already submitted
      const existing = await getKYCSubmission(userId);
      if (existing && existing.status === 'pending') {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'KYC submission already pending' },
          { status: 409 }
        );
      }

      const submission = await createKYCSubmission({
        user_id: userId,
        government_id_type: government_id_type as any,
        government_id_url,
        face_capture_url,
        status: 'pending',
      });

      if (!submission) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create submission' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof submission>>(
        { success: true, data: submission },
        { status: 201 }
      );
    } else if (action === 'get') {
      const submission = await getKYCSubmission(userId);
      return NextResponse.json<ApiResponse<typeof submission>>(
        { success: true, data: submission },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] KYC API error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get user to verify admin role (would need to fetch from DB in production)
    const submissions = await getPendingKYCSubmissions();

    return NextResponse.json<ApiResponse<typeof submissions>>(
      { success: true, data: submissions },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] KYC GET error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { action, submission_id, rejection_reason } = await request.json();

    if (action === 'approve') {
      const result = await approveKYCSubmission(submission_id, userId);
      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );
    } else if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Rejection reason required' },
          { status: 400 }
        );
      }
      const result = await rejectKYCSubmission(submission_id, userId, rejection_reason);
      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] KYC PATCH error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
