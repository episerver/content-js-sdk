// lib/optimizely/utils/language.ts

export const DEFAULT_LOCALE = 'en'
export const LOCALES = ['en', 'pl', 'sv']

export const getLocales = () => {
  return LOCALES
}

export const mapPathWithoutLocale = (path: string): string[] => {
  const parts = path.split('/').filter(Boolean)
  if (LOCALES.includes(parts[0] ?? '')) {
    parts.shift()
  }

  return parts
}
