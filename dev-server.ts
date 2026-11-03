import { createServer as createViteServer } from 'vite';
import { createApp } from './server.ts';

async function startDevelopmentServer() {
  const app = createApp();
  const vite = await createViteServer({
    server: { middlewareMode: true, host: '0.0.0.0', hmr: false },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  const portArg = process.argv.indexOf('--port');
  const port = portArg !== -1 && process.argv[portArg + 1]
    ? Number.parseInt(process.argv[portArg + 1], 10) || 3000
    : Number.parseInt(process.env.PORT || '3000', 10) || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Kisan Sahayak] Development server running at http://0.0.0.0:${port}`);
  });
}

startDevelopmentServer().catch(error => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});
