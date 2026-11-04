process.env.TEST_SUITE = 'true';
import assert from 'assert';
import { createExpressApp } from '../server';
import { handler as netlifyHandler } from '../netlify/functions/api';

async function runTestSuite() {
  console.log('\n========================================');
  console.log('   KISAN SAHAYAK AUTHENTICATION TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
      }
    })();
  }

  const app = createExpressApp();
  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Health check
    await test('GET /api/health returns 200 and healthy status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(typeof data.adminConfigured, 'boolean');
    });

    // 2. Admin login with valid credentials
    let adminToken = '';
    await test('POST /api/auth/admin-login with valid credentials generates JWT token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'admin');
      assert.ok(data.token, 'Token must be present in response');
      adminToken = data.token;
    });

    // 3. Admin login with invalid password
    await test('POST /api/auth/admin-login with invalid password returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // 4. Admin login with missing username returns 400
    await test('POST /api/auth/admin-login with missing username returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.error, 'Username is required');
    });

    // 5. Resilient string body parser (Netlify / Lambda edge case)
    await test('POST /api/auth/admin-login parses string req.body in serverless wrapper', async () => {
      // Simulate Netlify passing string body with text/plain or unparsed stream
      const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"username":"admin","password":"admin123"}'
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    // 6. Token verification
    await test('GET /api/auth/verify-session validates active admin JWT token', async () => {
      assert.ok(adminToken, 'adminToken must exist from previous test');
      const res = await fetch(`${baseUrl}/api/auth/verify-session`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.valid, true);
      assert.strictEqual(data.role, 'admin');
    });

    // 7. Token verification rejection with forged token
    await test('GET /api/auth/verify-session rejects invalid token with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/verify-session`, {
        headers: { Authorization: 'Bearer forged.invalid.token' }
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.valid, false);
    });

    // 8. Resolve identifier endpoint
    await test('POST /api/auth/resolve-identifier resolves email directly', async () => {
      const res = await fetch(`${baseUrl}/api/auth/resolve-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'farmer@example.com' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.resolved, true);
      assert.strictEqual(data.email, 'farmer@example.com');
    });

    await test('POST /api/auth/resolve-identifier resolves demo usernames', async () => {
      const res = await fetch(`${baseUrl}/api/auth/resolve-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'demo_farmer_1' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.resolved, true);
      assert.strictEqual(data.email, 'demo.farmer1@example.com');
    });

    await test('POST /api/auth/resolve-identifier rejects empty identifier', async () => {
      const res = await fetch(`${baseUrl}/api/auth/resolve-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: '   ' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.resolved, false);
    });

    // 9. Netlify Function handler simulation
    await test('Netlify Function handler handles OPTIONS preflight', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/.netlify/functions/api/auth/admin-login',
        headers: {}
      };
      const result: any = await netlifyHandler(event, {});
      assert.strictEqual(result.statusCode, 204);
      assert.strictEqual(result.headers['Access-Control-Allow-Origin'], '*');
    });

    await test('Netlify Function handler routes /.netlify/functions/api/health to Express', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/.netlify/functions/api/health',
        headers: {},
        body: null
      };
      const result: any = await netlifyHandler(event, {});
      assert.strictEqual(result.statusCode, 200);
      const body = JSON.parse(result.body);
      assert.strictEqual(body.status, 'healthy');
    });

    await test('Netlify Function handler processes admin login via /.netlify/functions/api/auth/admin-login', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/.netlify/functions/api/auth/admin-login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        isBase64Encoded: false
      };
      const result: any = await netlifyHandler(event, {});
      assert.strictEqual(result.statusCode, 200);
      const body = JSON.parse(result.body);
      assert.strictEqual(body.success, true);
      assert.ok(body.token);
    });

  } finally {
    server.close();
  }

  console.log('\n========================================');
  console.log(`   RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed to run:', err);
  process.exit(1);
});
