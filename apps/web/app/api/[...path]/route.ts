import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildUpstreamPath(path: string[]) {
  return path.join('/');
}

function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return context.params.then(({ path }) =>
    proxyToBackend(request, buildUpstreamPath(path)),
  );
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest;
