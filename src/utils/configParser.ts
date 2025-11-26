import type { Configuration } from '@botpress/webchat'

export interface ParsedConfig {
  clientId: string
  configuration: Configuration
}

/**
 * Extracts clientId and configuration from a Botpress webchat script content.
 * Handles both JavaScript object notation and JSON-like structures.
 */
export function extractConfigFromScript(scriptContent: string): ParsedConfig | null {
  try {
    // Extract the window.botpress.init() call - more flexible regex
    const initMatch = scriptContent.match(/window\.botpress\.init\s*\(\s*(\{[\s\S]*?\})\s*\)/)
    if (!initMatch) {
      throw new Error('Could not find window.botpress.init() in script')
    }

    // Use Function constructor to safely evaluate the object literal
    let config: any
    try {
      const evalCode = `(${initMatch[1]})`
      const fn = new Function('return ' + evalCode)
      config = fn()
    } catch (evalError) {
      // Fallback to regex-based parsing if evaluation fails
      console.warn('Direct evaluation failed, trying regex parsing:', evalError)

      const configStr = initMatch[1]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

      config = JSON.parse(configStr)
    }

    if (!config.clientId) {
      throw new Error('No clientId found in configuration')
    }

    const botId = config.botId || config.configuration?.botId

    return {
      clientId: config.clientId,
      configuration: {
        ...config.configuration,
        ...(botId && { botId }),
      },
    }
  } catch (err) {
    console.error('Failed to parse script:', err)
    console.error('Script content:', scriptContent.substring(0, 500))
    throw new Error(`Failed to parse Botpress script: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}
