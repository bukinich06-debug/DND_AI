import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

const withCors = (response: NextResponse) => {
  for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  return response;
};

export const proxy = (request: NextRequest) => {
  if (request.method === 'OPTIONS') return withCors(new NextResponse(null, { status: 204 }));

  return withCors(NextResponse.next());
};

export const config = {
  matcher: '/api/:path*',
};
