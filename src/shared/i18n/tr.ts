import type { Translations } from './translations'

export type TrAccessor<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, any>
      ? TrAccessor<T[K]>
      : never
} & { [key: string]: any }

export type Tr = TrAccessor<Translations>
