import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid file type. Use JPG, PNG, WEBP or PDF.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = 'kyc/' + userId + '/' + type + '_' + Date.now() + '.' + ext;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to upload file: ' + error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('kyc-documents')
      .getPublicUrl(filename);

    return NextResponse.json<ApiResponse<{ url: string; type: string }>>(
      { success: true, data: { url: urlData.publicUrl, type } },
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
