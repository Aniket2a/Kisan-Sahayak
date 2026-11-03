import serverless from 'serverless-http';
import { createApp } from '../../server.ts';

// Netlify's documented Express integration invokes the Lambda-compatible
// handler returned by serverless-http. Keep the standard handler shape so
// request method, path, headers, and JSON body are adapted consistently.
const app = createApp();
export const handler = serverless(app);
