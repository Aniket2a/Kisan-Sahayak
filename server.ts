import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  const secret = cleanEnvValue(process.env.JWT_SECRET || envFile.JWT_SECRET || '');
  return { username, email, hash, secret };
}

function verifyAdminPassword(submittedPassword: string, storedHashOrPassword: string): boolean {
  if (!submittedPassword || !storedHashOrPassword) return false;
  const target = cleanEnvValue(storedHashOrPassword);

  if (!/^\$2[aby]\$/.test(target) || target.length < 59 || target.length > 60) return false;
  try {
    return bcrypt.compareSync(submittedPassword, target);
  } catch {
    return false;
  }
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

  app.use(express.json({ limit: '1mb' }));

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


  // Server-only Supabase client. The service-role key is never exposed to the browser.
  let adminSupabase: SupabaseClient | null = null;
  const getAdminSupabase = (): SupabaseClient => {
    if (adminSupabase) return adminSupabase;
    const envFile = parseEnvFile(path.resolve(process.cwd(), '.env'));
    const url = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envFile.SUPABASE_URL || envFile.VITE_SUPABASE_URL);
    const serviceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !serviceKey) throw new Error('Server Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    adminSupabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    return adminSupabase;
  };

  const asyncAdmin = (handler: (req: Request, res: Response) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(handler(req, res)).catch(next);
    };

  const allowedResourceFields = ['title', 'description', 'category_id', 'resource_type', 'external_url', 'image_url', 'season_climate', 'eligibility', 'benefits', 'provider'];
  const cleanResourcePayload = (body: any, partial = false) => {
    const payload: Record<string, any> = {};
    for (const key of allowedResourceFields) {
      if (body && Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key];
    }
    if (!partial) {
      if (typeof payload.title !== 'string' || !payload.title.trim()) throw new Error('A resource title is required.');
      if (typeof payload.description !== 'string' || !payload.description.trim()) throw new Error('A resource description is required.');
      if (!Number.isInteger(Number(payload.category_id))) throw new Error('A valid category is required.');
      if (typeof payload.resource_type !== 'string' || !payload.resource_type.trim()) throw new Error('A resource type is required.');
    }
    if (payload.title !== undefined) payload.title = String(payload.title).trim();
    if (payload.description !== undefined) payload.description = String(payload.description).trim();
    if (payload.category_id !== undefined) {
      const categoryId = Number(payload.category_id);
      if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('A valid category is required.');
      payload.category_id = categoryId;
    }
    for (const key of ['external_url', 'image_url', 'season_climate', 'eligibility', 'benefits', 'provider']) {
      if (payload[key] === '') payload[key] = null;
    }
    if (partial && Object.keys(payload).length === 0) throw new Error('No editable resource fields were supplied.');
    return payload;
  };

  // --- API ROUTES ---

  // 1. Check if admin credentials are configured in backend environment
  app.get('/api/admin/status', (req: Request, res: Response) => {
    const { username, hash } = getEnvConfig();
    const isConfigured = Boolean(username && hash && /^\$2[aby]\$/.test(hash) && getEnvConfig().secret.length >= 32);
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

    if (!configUsername || !configHash || !/^\$2[aby]\$/.test(configHash) || configHash.length < 59 || configHash.length > 60 || secret.length < 32) {
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


  // Admin user directory backed by Supabase Auth and profiles.
  app.get('/api/admin/users', authenticateAdminToken, asyncAdmin(async (_req, res) => {
    const client = getAdminSupabase();
    const { data: authData, error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) return res.status(502).json({ error: authError.message });
    const authUsers = authData.users || [];
    const ids = authUsers.map(user => user.id);
    const { data: profiles, error: profileError } = ids.length
      ? await client.from('profiles').select('id, username, full_name, state, preferred_category, role, created_at').in('id', ids)
      : { data: [], error: null };
    if (profileError) return res.status(502).json({ error: profileError.message });
    const profileById = new Map((profiles || []).map(profile => [profile.id, profile]));
    const users = authUsers.map(user => {
      const profile = profileById.get(user.id);
      return {
        id: user.id,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Farmer',
        username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'farmer',
        email: user.email || '',
        state: profile?.state || user.user_metadata?.state || '',
        preferred_category: profile?.preferred_category || user.user_metadata?.preferred_category || '',
        role: profile?.role === 'admin' ? 'admin' : 'user',
        created_at: profile?.created_at || user.created_at
      };
    });
    return res.json({ users, total: users.length });
  }));

  app.patch('/api/admin/users/:id/role', authenticateAdminToken, asyncAdmin(async (req, res) => {
    const targetId = String(req.params.id || '');
    const role = req.body?.role;
    if (!/^[0-9a-f-]{36}$/i.test(targetId) || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'A valid user ID and role are required.' });
    }
    const client = getAdminSupabase();
    const { data: target, error: lookupError } = await client.from('profiles').select('id, role').eq('id', targetId).maybeSingle();
    if (lookupError) return res.status(502).json({ error: lookupError.message });
    if (!target) return res.status(404).json({ error: 'User profile was not found.' });
    if (target.role === role) return res.json({ success: true, id: targetId, role });
    const { error } = await client.rpc('admin_set_user_role', { p_target_user_id: targetId, p_new_role: role });
    if (error) return res.status(502).json({ error: error.message });
    return res.json({ success: true, id: targetId, role });
  }));

  app.delete('/api/admin/users/:id', authenticateAdminToken, asyncAdmin(async (req, res) => {
    const targetId = String(req.params.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return res.status(400).json({ error: 'A valid user ID is required.' });
    const client = getAdminSupabase();
    const { data: target, error: lookupError } = await client.from('profiles').select('id, role').eq('id', targetId).maybeSingle();
    if (lookupError) return res.status(502).json({ error: lookupError.message });
    if (!target) return res.status(404).json({ error: 'User profile was not found.' });
    const { error } = await client.auth.admin.deleteUser(targetId);
    if (error) return res.status(502).json({ error: error.message });
    return res.json({ success: true, id: targetId });
  }));

  app.post('/api/admin/resources', authenticateAdminToken, asyncAdmin(async (req, res) => {
    let payload: Record<string, any>;
    try { payload = cleanResourcePayload(req.body); }
    catch (error: any) { return res.status(400).json({ error: error.message }); }
    const client = getAdminSupabase();
    const { data, error } = await client.from('resources').insert(payload).select('*').single();
    if (error) return res.status(502).json({ error: error.message });
    return res.status(201).json({ resource: data });
  }));

  app.patch('/api/admin/resources/:id', authenticateAdminToken, asyncAdmin(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'A valid resource ID is required.' });
    let payload: Record<string, any>;
    try { payload = cleanResourcePayload(req.body, true); }
    catch (error: any) { return res.status(400).json({ error: error.message }); }
    const client = getAdminSupabase();
    const { data, error } = await client.from('resources').update(payload).eq('id', id).select('*').maybeSingle();
    if (error) return res.status(502).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Resource was not found.' });
    return res.json({ resource: data });
  }));

  app.delete('/api/admin/resources/:id', authenticateAdminToken, asyncAdmin(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'A valid resource ID is required.' });
    const client = getAdminSupabase();
    const { data, error } = await client.from('resources').delete().eq('id', id).select('id').maybeSingle();
    if (error) return res.status(502).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Resource was not found.' });
    return res.json({ success: true, id });
  }));

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
