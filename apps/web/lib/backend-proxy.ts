import type { NextRequest } from 'next/server';
import { resolveApiOrigin } from './resolve-api-origin.mjs';

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
] as const;

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  headers.set('x-forwarded-host', request.nextUrl.host);
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));

  return headers;
}

export async function proxyToBackend(
  request: NextRequest,
  upstreamPath: string,
) {
  const backendOrigin = resolveApiOrigin();
  const targetUrl = new URL(upstreamPath, `${backendOrigin}/`);

  targetUrl.search = request.nextUrl.search;

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: buildProxyHeaders(request),
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: new Headers(upstreamResponse.headers),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown proxy error';

    return Response.json(
      {
        message: 'Failed to reach backend service.',
        cause: message,
      },
      { status: 502 },
    );
  }
}
