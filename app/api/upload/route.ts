import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // ── AUTH ─────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { userId, valid } = verifyToken(token);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    // ── PARSE FORM DATA ───────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string | null) || 'government_id';

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ── VALIDATION ────────────────────────────────────────────────────────────
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid file type. Please use JPG, PNG, WEBP or PDF.' },
        { status: 400 }
      );
    }

    // ── BUILD FILENAME ────────────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `kyc/${userId}/${type}_${Date.now()}.${ext}`;

    // ── UPLOAD TO SUPABASE STORAGE ────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload] Supabase storage error:', uploadError.message);

      // Bucket might not exist — try to create it
      if (uploadError.message?.includes('Bucket not found') ||
          uploadError.message?.includes('bucket') ||
          uploadError.message?.includes('not found')) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Storage bucket not configured. Please contact support.' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Upload failed: ' + uploadError.message },
        { status: 500 }
      );
    }

    // ── GET URL ───────────────────────────────────────────────────────────────
    // Use signed URL (60 min) since bucket is private
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .createSignedUrl(filename, 60 * 60); // 1 hour

    // Fallback to public URL if signed fails
    let url = '';
    if (signedData?.signedUrl) {
      url = signedData.signedUrl;
    } else {
      const { data: publicData } = supabaseAdmin.storage
        .from('kyc-documents')
        .getPublicUrl(filename);
      url = publicData.publicUrl;
    }

    return NextResponse.json<ApiResponse<{ url: string; type: string; filename: string }>>(
      { success: true, data: { url, type, filename } },
      { status: 201 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[upload] Unhandled error:', msg);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}