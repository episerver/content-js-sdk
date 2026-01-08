import { LOCALES } from '@/lib/optimizely/language'
import { AlternateURLs } from 'next/dist/lib/metadata/types/alternative-urls-types'

export function normalizePath(path: string): string {
  path = path.toLowerCase()

  if (path === '/') {
    return ''
  }

  if (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }

  if (path.startsWith('/')) {
    path = path.substring(1)
  }

  return path
}

export function generateAlternates(
  locale: string,
  path: string
): AlternateURLs {
  path = normalizePath(path)

  return {
    canonical: `/${locale}/${path}`,
    languages: Object.assign(
      {},
      ...LOCALES.map((l) => ({ [l]: `/${l}/${path}` }))
    ),
  }
}
