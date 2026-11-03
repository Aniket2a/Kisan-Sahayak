import serverless from 'serverless-http';
import { withLambda } from '@netlify/aws-lambda-compat';
import { createApp } from '../../server.ts';

const app = createApp();
const expressHandler = serverless(app);

// Let Netlify's supported Lambda compatibility adapter translate the incoming
// Fetch Request into a complete Lambda event, including the POST body.
export default withLambda(async (event, context) => {
  const result = await (expressHandler as any)(event, context);
  return {
    statusCode: result.statusCode || 200,
    headers: result.headers || {},
    body: result.body ?? '',
    ...(result.isBase64Encoded ? { isBase64Encoded: true } : {}),
  };
});
