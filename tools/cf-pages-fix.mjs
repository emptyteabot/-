/**
 * Fix Cloudflare Pages project build settings via API (no dashboard clicking).
 *
 * Usage (PowerShell):
 *   $env:CLOUDFLARE_API_TOKEN="..."
 *   node tools/cf-pages-fix.mjs --project <project_name>
 *
 * Optional:
 *   $env:CLOUDFLARE_ACCOUNT_ID="..."   # if you want to skip auto-discovery
 *
 * What it does:
 * - Sets build_config.root_dir to "/" (repo root) to avoid "root directory not found"
 * - Sets build_command and destination_dir to this repo's Cloudflare Pages settings
 * - Triggers a new deployment build
 */

function parseArgs(argv) {
  const out = { project: '', rootDir: '/', buildCommand: 'npm run pages:build', destDir: '.vercel/output/static' }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--project') out.project = argv[++i] || ''
    else if (a === '--root') out.rootDir = argv[++i] || '/'
    else if (a === '--build') out.buildCommand = argv[++i] || out.buildCommand
    else if (a === '--dest') out.destDir = argv[++i] || out.destDir
  }
  return out
}

async function cfFetch(path, init) {
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!token) throw new Error('Missing env CLOUDFLARE_API_TOKEN')

  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { success: false, errors: [{ message: text.slice(0, 400) }] }
  }
  if (!res.ok || json?.success === false) {
    const msg = json?.errors?.map((e) => e.message).join(' | ') || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

async function resolveAccountId(projectName) {
  const explicit = process.env.CLOUDFLARE_ACCOUNT_ID
  if (explicit) return explicit

  const accounts = await cfFetch('/accounts', { method: 'GET' })
  const list = accounts?.result || []
  for (const a of list) {
    const id = a?.id
    if (!id) continue
    try {
      await cfFetch(`/accounts/${id}/pages/projects/${encodeURIComponent(projectName)}`, { method: 'GET' })
      return id
    } catch {
      // try next account
    }
  }
  throw new Error('Could not auto-discover CLOUDFLARE_ACCOUNT_ID. Set it explicitly and retry.')
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.project) {
    console.error('Usage: node tools/cf-pages-fix.mjs --project <project_name>')
    process.exit(2)
  }

  const accountId = await resolveAccountId(args.project)

  // 1) Patch build config
  const patchBody = {
    production_branch: 'main',
    build_config: {
      root_dir: args.rootDir,
      build_command: args.buildCommand,
      destination_dir: args.destDir,
    },
  }

  await cfFetch(`/accounts/${accountId}/pages/projects/${encodeURIComponent(args.project)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchBody),
  })

  // 2) Trigger a deployment (git-backed project). Docs show POST with no body is valid.
  const dep = await cfFetch(`/accounts/${accountId}/pages/projects/${encodeURIComponent(args.project)}/deployments`, {
    method: 'POST',
  })

  const aliases = dep?.result?.aliases || []
  const url = aliases[0] || '(no alias yet)'
  console.log('Triggered deployment. URL (may take ~1-3 min to be ready):', url)
}

main().catch((e) => {
  console.error('CF Pages fix failed:', e?.message || e)
  process.exit(1)
})

