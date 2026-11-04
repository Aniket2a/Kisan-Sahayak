import serverless from 'serverless-http';
import { createExpressApp } from '../../server';

const app = createExpressApp();

const serverlessHandler = serverless(app, {
  request: (req: any, event: any) => {
    // Normalize request path so that Netlify paths (e.g. /.netlify/functions/api/...)
    // always map cleanly to Express /api/... routes
    let requestPath = event.path || req.url || '';
    if (requestPath.startsWith('/.netlify/functions/api')) {
      requestPath = requestPath.replace('/.netlify/functions/api', '/api');
    }
    if (!requestPath.startsWith('/api')) {
      requestPath = '/api' + (requestPath.startsWith('/') ? requestPath : '/' + requestPath);
    }
    req.url = requestPath;

    // Preserve decoded body if base64 encoded
    if (event.isBase64Encoded && event.body) {
      try {
        req.body = Buffer.from(event.body, 'base64').toString('utf-8');
      } catch {
        // preserve original
      }
    } else if (event.body) {
      req.body = event.body;
    }
  }
});

export const handler = async (event: any, context: any) => {
  // CORS Preflight OPTIONS handler
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  return serverlessHandler(event, context);
};
