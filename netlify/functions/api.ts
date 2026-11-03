import serverless from 'serverless-http';
import { withLambda } from '@netlify/aws-lambda-compat';
import { createApp } from '../../server.ts';

// serverless-http uses API Gateway event typings; the runtime adapter accepts
// the Lambda-compatible handler contract. The runtime conversion is handled by withLambda.
const app = createApp();
const expressHandler = serverless(app);

export default withLambda(
  expressHandler as unknown as Parameters<typeof withLambda>[0],
);
