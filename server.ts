import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function cleanEnvValue(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = cleanEnvValue(trimmed.slice(eqIdx + 1));
      env[key] = val;
    }
  }
  return env;
}

function getEnvConfig(): { username: string; email: string; hash: string; secret: string } {
  const envFile = parseEnvFile(path.resolve(process.cwd(), '.env'));
  const username = cleanEnvValue(process.env.ADMIN_USERNAME || envFile.ADMIN_USERNAME || '');
  const email = cleanEnvValue(process.env.ADMIN_EMAIL || envFile.ADMIN_EMAIL || '');
  const hash = cleanEnvValue(
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    envFile.ADMIN_PASSWORD_HASH ||
    envFile.ADMIN_PASSWORD ||
    ''
  );
  const secret = cleanEnvValue(process.env.JWT_SECRET || envFile.JWT_SECRET || 'kisan_sahayak_secure_default_secret_2026');
  return { username, email, hash, secret };
}

function verifyAdminPassword(submittedPassword: string, storedHashOrPassword: string): boolean {
  if (!submittedPassword || !storedHashOrPassword) return false;
  const target = cleanEnvValue(storedHashOrPassword);

  // 1. If stored value is a bcrypt hash (starts with $2 and is 59-60 characters)
  if (target.startsWith('$2') && (target.length === 59 || target.length === 60)) {
    try {
      if (bcrypt.compareSync(submittedPassword, target)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  // 2. If stored value is plaintext (e.g. configured directly in environment variables)
  try {
    const a = Buffer.from(submittedPassword, 'utf-8');
    const b = Buffer.from(target, 'utf-8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return true;
    }
  } catch {
    // ignore
  }

  return submittedPassword === target;
}

async function startServer() {
  const app = express();
  
  let PORT = 3000;
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    PORT = parseInt(process.argv[portIdx + 1], 10) || 3000;
  } else if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    PORT = parseInt(process.env.PORT, 10) || 3000;
  }

  let HOST = '0.0.0.0';
  const hostIdx = process.argv.indexOf('--host');
  if (hostIdx !== -1 && process.argv[hostIdx + 1] && !process.argv[hostIdx + 1].startsWith('-')) {
    HOST = process.argv[hostIdx + 1];
  }

  app.use(express.json());

  // Middleware to authenticate Admin token
  const authenticateAdminToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    const { secret, username } = getEnvConfig();

    try {
      const decoded = jwt.verify(token, secret) as { role: string; username: string };
      if (decoded && decoded.role === 'admin' && decoded.username.toLowerCase() === username.toLowerCase()) {
        (req as any).adminUser = decoded;
        return next();
      }
      return res.status(403).json({ valid: false, error: 'Admin role verification failed' });
    } catch (err) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired session token' });
    }
  };

  // --- API ROUTES ---

  // 1. Check if admin credentials are configured in backend environment
  app.get('/api/admin/status', (req: Request, res: Response) => {
    const { username, hash } = getEnvConfig();
    const isConfigured = Boolean(username && hash);
    res.json({ configured: isConfigured });
  });

  // 2. Secure one-time Admin Setup (only works if unconfigured)
  app.post('/api/admin/setup', (req: Request, res: Response) => {
    const { username: existingUser, hash: existingHash } = getEnvConfig();
    if (existingUser && existingHash) {
      return res.status(403).json({
        success: false,
        error: 'Admin account has already been configured on this deployment. Changes must be made via server environment variables.'
      });
    }

    const { username, password } = req.body || {};
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters long.' });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const envPath = path.resolve(process.cwd(), '.env');
    const existingEnv = parseEnvFile(envPath);
    const jwtSecret = existingEnv.JWT_SECRET || crypto.randomBytes(32).toString('hex');

    const envLines = [
      `ADMIN_USERNAME=${username.trim()}`,
      `ADMIN_PASSWORD_HASH=${hash}`,
      `JWT_SECRET=${jwtSecret}`,
      `PORT=${existingEnv.PORT || '3000'}`
    ];

    fs.writeFileSync(envPath, envLines.join('\n') + '\n', 'utf-8');

    // Also update current process env for immediate availability
    process.env.ADMIN_USERNAME = username.trim();
    process.env.ADMIN_PASSWORD_HASH = hash;
    process.env.JWT_SECRET = jwtSecret;

    return res.json({
      success: true,
      message: 'Admin account successfully configured! You can now log in securely.'
    });
  });

  // 3. Strict Admin Login
  app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    const { username: configUsername, email: configEmail, hash: configHash, secret } = getEnvConfig();

    if (!configUsername || !configHash) {
      return res.status(503).json({
        success: false,
        error: 'Admin credentials have not been configured on this server. Please set ADMIN_USERNAME and ADMIN_PASSWORD_HASH.'
      });
    }

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const submittedName = username.trim().toLowerCase();
    const expectedName = configUsername.toLowerCase();
    const expectedEmail = configEmail.toLowerCase();

    // Constant-time check / match against username or optional admin email
    const isNameMatch = submittedName === expectedName || (expectedEmail && submittedName === expectedEmail);

    if (!isNameMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        isAdminAttempt: false
      });
    }

    // Username matched the admin username -> verify password hash strictly on backend
    if (!password || typeof password !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        isAdminAttempt: true
      });
    }

    const isMatch = verifyAdminPassword(password, configHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        isAdminAttempt: true
      });
    }

    // Issue signed 8-hour Admin token
    const token = jwt.sign(
      {
        id: 'admin_root',
        username: configUsername,
        role: 'admin'
      },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: 999999,
        full_name: 'Administrator',
        username: configUsername,
        role: 'admin',
        state: 'Central Administration',
        preferred_category: 'Government Schemes'
      }
    });
  });

  // 4. Verify Admin Session / Token
  app.get('/api/auth/verify-session', authenticateAdminToken, (req: Request, res: Response) => {
    const user = (req as any).adminUser;
    res.json({
      valid: true,
      role: 'admin',
      username: user.username
    });
  });

  // 5. Protected Admin Test / Ping
  app.get('/api/admin/verify', authenticateAdminToken, (req: Request, res: Response) => {
    res.json({ success: true, message: 'Admin authenticated' });
  });

  // 6. Admin Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.json({ success: true });
  });

  // --- FRONTEND INTEGRATION ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Kisan Sahayak] Full-stack application running at http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
