import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'government_id' or 'face_capture'

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `kyc/${userId}/${type}_${timestamp}.${file.type.split('/')[1]}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'private',
      addRandomSuffix: false,
    });

    return NextResponse.json<ApiResponse<{ url: string; type: string }>>(
      {
        success: true,
        data: {
          url: blob.url,
          type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Upload error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
