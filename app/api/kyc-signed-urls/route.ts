import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Extracts the storage path from a Supabase URL
function extractPath(url: string): string | null {
  if (!url) return null;
  try {
    // Handles both public and signed URLs
    // Pattern: /storage/v1/object/(sign|public)/kyc-documents/kyc/...
    const match = url.match(/\/storage\/v1\/object\/(?:sign\/|public\/)?kyc-documents\/(kyc\/.+?)(?:\?|$)/);
    if (match) return match[1];
    // Try signed URL pattern with token
    const match2 = url.match(/\/kyc-documents\/(kyc\/.+?)(?:\?|$)/);
    if (match2) return match2[1];
    return null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — must be admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const { userId, valid } = verifyToken(token);
    if (!valid || !userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('users').select('role, email').eq('id', userId).single();
    const isAdmin = adminUser?.role === 'admin' || adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { government_id_url, face_capture_url } = await request.json();

    // Generate fresh signed URLs (2 hour expiry for admin review)
    const EXPIRY = 60 * 60 * 2; // 2 hours

    async function getFreshUrl(originalUrl: string): Promise<string> {
      const path = extractPath(originalUrl);
      if (!path) return originalUrl; // fallback to original

      const { data, error } = await supabaseAdmin.storage
        .from('kyc-documents')
        .createSignedUrl(path, EXPIRY);

      if (error || !data?.signedUrl) {
        console.error('[kyc-signed-urls] Failed to sign:', path, error?.message);
        return originalUrl; // fallback
      }
      return data.signedUrl;
    }

    const [idUrl, faceUrl] = await Promise.all([
      getFreshUrl(government_id_url || ''),
      getFreshUrl(face_capture_url  || ''),
    ]);

    return NextResponse.json({ success: true, id_url: idUrl, face_url: faceUrl });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc-signed-urls] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}