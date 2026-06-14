import type { Translations } from './translations'

export type TrAccessor<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? TrAccessor<T[K]>
      : never
} & { [key: string]: unknown }

export type Tr = TrAccessor<Translations>
