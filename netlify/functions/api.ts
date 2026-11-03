import serverless from 'serverless-http';
import { createApp } from '../../server.ts';

const app = createApp();
const expressHandler = serverless(app);

// Netlify supplies a Fetch Request. Convert it to the API Gateway v2 event
// expected by serverless-http, preserving the exact POST body.
export default async (request: Request, context: { requestId?: string }) => {
  const url = new URL(request.url);
  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
  const requestBody = hasBody ? await request.text() : undefined;
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  const event = {
    version: '2.0',
    routeKey: '$default',
    rawPath: url.pathname,
    rawQueryString: url.search.startsWith('?') ? url.search.slice(1) : '',
    headers,
    requestContext: {
      requestId: context.requestId || 'netlify-request',
      http: {
        method: request.method,
        path: url.pathname,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: request.headers.get('user-agent') || ''
      }
    },
    body: requestBody,
    isBase64Encoded: false
  };

  const result = await (expressHandler as any)(event, {});
  const responseHeaders = new Headers(result.headers || {});
  if (result.isBase64Encoded) {
    const binary = Uint8Array.from(atob(result.body || ''), char => char.charCodeAt(0));
    return new Response(binary, { status: result.statusCode || 200, headers: responseHeaders });
  }

  return new Response(result.body ?? '', {
    status: result.statusCode || 200,
    headers: responseHeaders
  });
};
