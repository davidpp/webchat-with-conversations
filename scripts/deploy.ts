import { Client } from '@botpress/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { deployConfigs, availableTargets, type DeployTarget } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get target from command line argument
const target = process.argv[2] as DeployTarget | undefined
const version = process.env.WEBCHAT_VERSION || '4.0'
const token = process.env.BOTPRESS_PAT

function showUsage() {
  console.error('Usage: pnpm run deploy <target>')
  console.error('')
  console.error('Available targets:')
  for (const t of availableTargets) {
    const config = deployConfigs[t]
    console.error(`  ${t.padEnd(15)} - ${config.description}`)
  }
  console.error('')
  console.error('Example:')
  console.error('  pnpm run deploy ledvance_prod')
  console.error('  pnpm run deploy ledvance_dev')
  console.error('')
  console.error('Requires BOTPRESS_PAT environment variable to be set.')
}

function validateConfig() {
  if (!target) {
    console.error('Error: No deployment target specified.\n')
    showUsage()
    process.exit(1)
  }

  if (!availableTargets.includes(target)) {
    console.error(`Error: Unknown target "${target}".\n`)
    showUsage()
    process.exit(1)
  }

  if (!token) {
    console.error('Error: BOTPRESS_PAT environment variable is not set.\n')
    console.error('Set it in your shell:')
    console.error('  export BOTPRESS_PAT=your_personal_access_token')
    process.exit(1)
  }
}

async function deploy() {
  validateConfig()

  const config = deployConfigs[target!]
  const fileKey = `webchat-custom/v${version}/inject.js`

  // Tags for organization and querying
  const tags = {
    source: 'custom-webchat',
    system: 'true',
    feature: 'webchat-with-conversations',
    type: 'inject',
    version,
    target: target!,
  }

  console.log(`Deploying to ${config.description}...`)
  console.log('  Target:', target)
  console.log('  Version:', version)
  console.log('  Key:', fileKey)
  console.log('  Workspace:', config.workspaceId)
  console.log('  Bot:', config.botId)
  console.log('')

  const client = new Client({
    token: token!,
    workspaceId: config.workspaceId,
    botId: config.botId,
  })

  const injectPath = path.join(__dirname, '../dist/inject.js')

  if (!fs.existsSync(injectPath)) {
    console.error('Error: dist/inject.js not found. Run `pnpm run build` first.')
    process.exit(1)
  }

  const injectJs = fs.readFileSync(injectPath, 'utf-8')
  const sizeKb = (injectJs.length / 1024).toFixed(1)

  console.log(`  File size: ${sizeKb} KB`)
  console.log('')

  const { file } = await client.uploadFile({
    key: fileKey,
    content: injectJs,
    contentType: 'application/javascript',
    accessPolicies: ['public_content'],
    publicContentImmediatelyAccessible: true,
    tags,
  })

  console.log('✓ Deployed successfully!')
  console.log('')
  console.log('Public URL:', file.url)
  console.log('')
  console.log('Usage in HTML:')
  console.log(`  <script src="${file.url}"></script>`)
}

deploy().catch((err) => {
  console.error('Deploy failed:', err.message)
  process.exit(1)
})
