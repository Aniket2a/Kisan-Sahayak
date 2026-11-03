import serverless from 'serverless-http';
import { createApp } from '../../server.ts';

const app = createApp();
const expressHandler = serverless(app);

// Netlify's current web-function runtime supplies a Fetch Request. Convert it
// explicitly to the Lambda event shape expected by serverless-http so POST
// bodies are preserved (including binary-safe base64 transport).
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const rawBody = Buffer.from(await request.arrayBuffer());

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const event = {
    httpMethod: request.method,
    path: url.pathname,
    headers,
    multiValueHeaders: {},
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    multiValueQueryStringParameters: {},
    pathParameters: {},
    stageVariables: {},
    body: rawBody.toString('base64'),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: request.method,
      path: url.pathname,
      identity: {},
    },
  };

  const result = await (expressHandler as any)(event, {});
  const responseHeaders = new Headers(result.headers || {});
  return new Response(result.body ?? '', {
    status: result.statusCode || 200,
    headers: responseHeaders,
  });
};
