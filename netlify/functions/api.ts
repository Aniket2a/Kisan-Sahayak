import serverless from 'serverless-http';
import { createApp } from '../../server.ts';

// Use Netlify's documented Express/Lambda function entry point.
// The named handler export ensures Netlify passes the Lambda event (including
// the POST body) to serverless-http instead of invoking it as a web Request handler.
const app = createApp();

export const handler = serverless(app);
