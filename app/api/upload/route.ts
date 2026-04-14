import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // ── AUTH ──────────────────────────────────────────────────────────────────
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
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to parse form data. Please try again.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string | null) || 'government_id';

    if (!file || file.size === 0) {
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

    // ── READ FILE — use Uint8Array, works in all runtimes including Edge ──────
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // ── UPLOAD TO SUPABASE STORAGE ────────────────────────────────────────────
    const { error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload] Supabase storage error:', uploadError.message);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Upload failed: ' + uploadError.message },
        { status: 500 }
      );
    }

    // ── GET SIGNED URL (private bucket) ───────────────────────────────────────
    const { data: signedData } = await supabaseAdmin.storage
      .from('kyc-documents')
      .createSignedUrl(filename, 60 * 60); // 1 hour

    // Fallback to public URL if signed URL fails
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
    // Always return JSON — never let a plain text error reach the client
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Upload failed: ' + msg },
      { status: 500 }
    );
  }
}