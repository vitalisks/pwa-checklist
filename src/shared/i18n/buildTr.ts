import type { Tr } from './tr'
import type { Translations } from './translations'

function makeProxy(obj: Record<string, unknown>): object {
  if (obj == null) return {}
  return new Proxy(obj, {
    get(target, prop: string) {
      const value = target[prop]
      if (typeof value === 'string') return value
      if (value !== null && typeof value === 'object')
        return makeProxy(value as Record<string, unknown>)
      if (typeof prop === 'symbol') return undefined
      return `[${prop}]`
    },
  })
}

export function buildTr(translations: Translations): Tr {
  return makeProxy(translations as unknown as Record<string, unknown>) as Tr
}
