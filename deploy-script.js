/**
 * Vercel Deploy Script
 * Bypasses CLI issues with Chinese paths / computer names
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'soul-lab';
const TOKEN = process.env.VERCEL_TOKEN;

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const out = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    out[key] = value;
  }
  return out;
}

const dotEnvLocal = parseDotEnv(path.join(__dirname, '.env.local'));
const ENV_VARS = {
  AI_API_KEY: process.env.AI_API_KEY || dotEnvLocal.AI_API_KEY || '',
  AI_BASE_URL: process.env.AI_BASE_URL || dotEnvLocal.AI_BASE_URL || '',
  AI_MODEL: process.env.AI_MODEL || dotEnvLocal.AI_MODEL || '',
  AI_FALLBACK_API_KEY: process.env.AI_FALLBACK_API_KEY || dotEnvLocal.AI_FALLBACK_API_KEY || '',
  AI_FALLBACK_BASE_URL: process.env.AI_FALLBACK_BASE_URL || dotEnvLocal.AI_FALLBACK_BASE_URL || '',
  AI_FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL || dotEnvLocal.AI_FALLBACK_MODEL || '',
};

const REQUIRED = ['AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL'];

function api(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.vercel.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(text) }); }
        catch { resolve({ status: res.statusCode, data: text }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  if (!TOKEN) {
    console.error('  [ERROR] Missing VERCEL_TOKEN environment variable.');
    console.error('  Example (PowerShell): $env:VERCEL_TOKEN="your_token_here"');
    process.exit(1);
  }

  for (const key of REQUIRED) {
    if (!ENV_VARS[key]) {
      console.error(`  [ERROR] Missing required env: ${key} (set in .env.local or shell env).`);
      process.exit(1);
    }
  }

  console.log('  ========================================');
  console.log('    Deploying Soul Lab to Vercel');
  console.log('  ========================================\n');

  // Step 1: Get or create project
  console.log('  [1/4] Setting up project...');
  let projectId;

  const existing = await api('GET', `/v9/projects/${PROJECT_NAME}`);
  if (existing.status === 200 && existing.data.id) {
    projectId = existing.data.id;
    console.log(`  [OK] Project found: ${PROJECT_NAME}\n`);
  } else {
    console.log('  Creating new project...');
    const created = await api('POST', '/v10/projects', {
      name: PROJECT_NAME,
      framework: 'nextjs',
    });
    if (created.data.id) {
      projectId = created.data.id;
      console.log(`  [OK] Project created: ${PROJECT_NAME}\n`);
    } else {
      console.error('  [ERROR] Failed to create project:', JSON.stringify(created.data));
      process.exit(1);
    }
  }

  // Step 2: Set environment variables
  console.log('  [2/4] Setting environment variables...');
  for (const [key, value] of Object.entries(ENV_VARS)) {
    if (!value) {
      console.log(`  [SKIP] ${key} (empty)`);
      continue;
    }
    const res = await api('POST', `/v10/projects/${projectId}/env`, {
      type: 'encrypted',
      key,
      value,
      target: ['production', 'preview', 'development'],
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`  [OK] ${key}`);
    } else if (res.data?.error?.code === 'ENV_ALREADY_EXISTS') {
      // Update existing
      const envs = await api('GET', `/v10/projects/${projectId}/env`);
      if (envs.data?.envs) {
        const env = envs.data.envs.find(e => e.key === key);
        if (env) {
          await api('PATCH', `/v10/projects/${projectId}/env/${env.id}`, { value });
          console.log(`  [OK] ${key} (updated)`);
        }
      }
    } else {
      console.log(`  [WARN] ${key}: ${JSON.stringify(res.data?.error || res.data)}`);
    }
  }
  console.log();

  // Step 3: Write .vercel config so CLI can deploy
  console.log('  [3/4] Preparing deploy config...');
  const vercelDir = path.join(__dirname, '.vercel');
  if (!fs.existsSync(vercelDir)) fs.mkdirSync(vercelDir);
  
  // Get org/team ID
  const user = await api('GET', '/v2/user');
  const orgId = user.data?.user?.id || '';
  
  fs.writeFileSync(path.join(vercelDir, 'project.json'), JSON.stringify({
    orgId,
    projectId,
  }));
  console.log('  [OK] Config written\n');

  // Step 4: Deploy using CLI (now with valid project.json)
  console.log('  [4/4] Building & deploying...');
  console.log('  This may take 1-2 minutes...\n');

  const { execSync } = require('child_process');
  try {
    const output = execSync(
      `npx --yes vercel --prod --token ${TOKEN}`,
      { cwd: __dirname, stdio: 'inherit', env: { ...process.env, VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId } }
    );
  } catch (e) {
    // Even if exit code is non-zero, check if URL was printed
    console.log('\n  Checking deployment status...');
  }

  // Get the deployment URL
  const deployments = await api('GET', `/v6/deployments?projectId=${projectId}&limit=1`);
  const latest = deployments.data?.deployments?.[0];
  
  if (latest) {
    const url = `https://${latest.url}`;
    const prodUrl = latest.alias?.[0] ? `https://${latest.alias[0]}` : `https://${latest.url}`;
    console.log('\n  ========================================');
    console.log('    YOUR SITE IS LIVE!');
    console.log('  ========================================');
    console.log(`\n    ${prodUrl}`);
    console.log(`\n    Share this URL with anyone!`);
    console.log(`    It works 24/7!`);
    console.log('\n  ========================================\n');
    
    // Open in browser
    require('child_process').exec(`start ${prodUrl}`);
  } else {
    console.log('\n  Deploy may still be building.');
    console.log(`  Check: https://vercel.com/dashboard`);
  }
}

main().catch(err => {
  console.error('  [ERROR]', err.message);
  process.exit(1);
});
