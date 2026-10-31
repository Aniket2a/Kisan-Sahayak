import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import readline from 'readline';

function parseEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

function saveEnv(filePath: string, entries: Record<string, string>) {
  let existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  const lines = existingContent.split('\n');
  const writtenKeys = new Set<string>();

  const newLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      if (key in entries) {
        writtenKeys.add(key);
        return `${key}=${entries[key]}`;
      }
    }
    return line;
  });

  for (const [key, value] of Object.entries(entries)) {
    if (!writtenKeys.has(key)) {
      newLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n').trim() + '\n', 'utf-8');
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('   Kisan Sahayak – Secure Private Admin Setup Tool   ');
  console.log('======================================================\n');
  console.log('This utility configures the single authorized Admin account.');
  console.log('Only the bcrypt password hash is stored.\n');

  let username = process.argv[2];
  let password = process.argv[3];

  if (!username) {
    username = await prompt('Enter desired private Admin username: ');
  }

  if (!username || username.trim().length < 3) {
    console.error('Error: Admin username must be at least 3 characters long.');
    process.exit(1);
  }

  if (!password) {
    password = await prompt('Enter desired private Admin password: ');
  }

  if (!password || password.trim().length < 6) {
    console.error('Error: Admin password must be at least 6 characters long.');
    process.exit(1);
  }

  console.log('\nGenerating bcrypt password hash (salt rounds: 12)...');
  const hash = bcrypt.hashSync(password, 12);

  const envPath = path.resolve(process.cwd(), '.env');
  const currentEnv = parseEnv(envPath);

  const jwtSecret = currentEnv.JWT_SECRET || crypto.randomBytes(32).toString('hex');

  const configToSave: Record<string, string> = {
    ADMIN_USERNAME: username.trim(),
    ADMIN_PASSWORD_HASH: hash,
    JWT_SECRET: jwtSecret,
    PORT: currentEnv.PORT || '3000'
  };

  saveEnv(envPath, configToSave);

  console.log('\n[SUCCESS] Private Admin account configured securely!');
  console.log(`- Configured Username: ${username.trim()}`);
  console.log(`- Password Hash: ${hash.slice(0, 10)}...[STORED IN .env]`);
  console.log(`- Updated: ${envPath}`);
  console.log('\nDeployment Environment Configuration:');
  console.log('If deploying to Cloud Run / production container, set these variables:');
  console.log(`  ADMIN_USERNAME=${username.trim()}`);
  console.log(`  ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`  JWT_SECRET=${jwtSecret}`);
  console.log('\nYou can now log in at the /login page using these private credentials.\n');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
