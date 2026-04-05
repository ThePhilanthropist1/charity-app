import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ua = request.headers.get('user-agent') || 'unknown';
  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });

  return NextResponse.json({
    userAgent: ua,
    isPiBrowser: ua.includes('PiBrowser') || ua.includes('Pi Network') || ua.includes('PiNetwork'),
    headers: allHeaders,
  });
}