// Deployment configurations for different clients/environments
// PAT is read from BOTPRESS_PAT environment variable

export type DeployTarget = 'ledvance_prod' | 'ledvance_dev'

export interface DeployConfig {
  workspaceId: string
  botId: string
  description: string
  // Bot config script URL (from Botpress dashboard)
  botConfigUrl: string
  // Deployed inject.js URL (updated after each deploy)
  injectUrl?: string
}

export const deployConfigs: Record<DeployTarget, DeployConfig> = {
  ledvance_prod: {
    workspaceId: 'wkspace_01JN1SFN5K678AZFHH4XH4ESW9',
    botId: '028a5315-3fc4-475c-b39b-1877907b641a',
    description: 'Ledvance Production',
    botConfigUrl: 'https://files.bpcontent.cloud/2025/10/02/07/20251002074359-QIWP7U83.js',
    injectUrl: 'https://files.bpcontent.cloud/2025/12/11/11/20251211112356-4J3G8L8Y.js',
  },
  ledvance_dev: {
    workspaceId: 'wkspace_01JN1SFN5K678AZFHH4XH4ESW9',
    botId: '67426d9f-7803-4973-9985-72c8a7da1c3e',
    description: 'Ledvance Development',
    botConfigUrl: 'https://files.bpcontent.cloud/2025/06/04/08/20250604082135-XQ11SC01.js',
    injectUrl: 'https://files.bpcontent.cloud/2025/12/11/01/20251211015050-TTMNAOEH.js',
  },
}

export const availableTargets = Object.keys(deployConfigs) as DeployTarget[]
