import serverless from 'serverless-http';
import { createApp } from '../../server.ts';

// The API is served by Netlify Functions; the static frontend is served by Netlify's CDN.
const app = createApp();

export const handler = serverless(app);
