import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

// Derive MIME type from file extension when browser sends wrong/empty type
function getMimeType(filename: string, browserType: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const extMap: Record<string, string> = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    pdf:  'application/pdf',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  // Trust browser type if it's a known good type
  const trusted = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
  if (trusted.includes(browserType)) return browserType;
  // Fall back to extension-based detection
  return extMap[ext] || browserType || 'image/jpeg';
}

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
        { success: false, error: 'Failed to parse upload. Please try again.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string | null) || 'government_id';

    if (!file || file.size === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No file received. Please select a file and try again.' },
        { status: 400 }
      );
    }

    // ── SIZE CHECK ────────────────────────────────────────────────────────────
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // ── MIME TYPE — derive from extension if browser sends wrong type ─────────
    const mimeType = getMimeType(file.name, file.type);
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/heic', 'image/heif', 'application/pdf',
    ];
    if (!allowedMimes.includes(mimeType)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `File type "${mimeType}" is not supported. Please use JPG, PNG, WEBP or PDF.` },
        { status: 400 }
      );
    }

    // ── BUILD FILENAME ────────────────────────────────────────────────────────
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ext = rawExt === 'heic' || rawExt === 'heif' ? 'jpg' : rawExt;
    const filename = `kyc/${userId}/${type}_${Date.now()}.${ext}`;

    // ── UPLOAD — Uint8Array works in all runtimes ─────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array  = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(filename, uint8Array, {
        contentType: mimeType === 'image/heic' || mimeType === 'image/heif'
          ? 'image/jpeg'
          : mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload] Storage error:', uploadError.message);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Storage upload failed: ' + uploadError.message },
        { status: 500 }
      );
    }

    // ── GET URL ───────────────────────────────────────────────────────────────
    const { data: signedData } = await supabaseAdmin.storage
      .from('kyc-documents')
      .createSignedUrl(filename, 60 * 60); // 1 hour

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload] Unhandled error:', msg);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Upload failed: ' + msg },
      { status: 500 }
    );
  }
}