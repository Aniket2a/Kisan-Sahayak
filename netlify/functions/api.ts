import serverless from 'serverless-http';
import { withLambda } from '@netlify/aws-lambda-compat';
import { createApp } from '../../server.ts';

// Adapt the Express app's Lambda-style handler to Netlify's modern Functions runtime.
// This preserves Express routing and ensures POST bodies are translated correctly.
const app = createApp();
const expressHandler = serverless(app);

export default withLambda(expressHandler);
