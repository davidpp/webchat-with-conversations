import type { InterpolationValues } from './types'

/**
 * Interpolates values into a template string.
 *
 * @example
 * interpolate('{n}m ago', { n: 5 }) // '5m ago'
 * interpolate('Hello {name}!', { name: 'World' }) // 'Hello World!'
 */
export function interpolate(
  template: string,
  values?: InterpolationValues
): string {
  if (!values) return template

  return template.replace(/\{(\w+)\}/g, (match, key) =>
    values[key] !== undefined ? String(values[key]) : match
  )
}
