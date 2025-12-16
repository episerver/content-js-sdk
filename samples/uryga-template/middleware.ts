// middleware.ts
import { DEFAULT_LOCALE, LOCALES } from '@/lib/optimizely/language'
import { createUrl, leadingSlashUrlPath } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Negotiator from 'negotiator'

const COOKIE_NAME_LOCALE = '__LOCALE_NAME'
const HEADER_KEY_LOCALE = 'X-Locale'

function shouldExclude(path: string) {
  return (
    path.startsWith('/static') ||
    path.includes('/api/') ||
    path.includes('.') ||
    path.includes('/json') ||
    path.includes('/preview')
  )
}

function getBrowserLanguage(
  request: NextRequest,
  locales: string[]
): string | undefined {
  const headerLanguage = request.headers.get('Accept-Language')
  if (!headerLanguage) {
    return undefined
  }

  // Create a negotiator instance with the Accept-Language header
  const languages = new Negotiator({
    headers: { 'accept-language': headerLanguage },
  }).languages()

  // Find the first language that matches our supported locales
  for (const lang of languages) {
    // Check for exact match
    if (locales.includes(lang)) {
      return lang
    }

    // Check for language match without region (e.g., 'pl-PL' should match 'pl')
    const langPrefix = lang.split('-')[0]
    if (locales.includes(langPrefix)) {
      return langPrefix
    }
  }

  return undefined
}

function getLocale(request: NextRequest, locales: string[]): string {
  // First check if there's a locale cookie
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // If no cookie, try to use browser language
  const browserLang = getBrowserLanguage(request, locales)
  if (browserLang && locales.includes(browserLang)) {
    return browserLang
  }

  // Fall back to default locale
  return DEFAULT_LOCALE
}

function updateLocaleCookies(
  request: NextRequest,
  response: NextResponse,
  locale?: string
): void {
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  const newLocale = locale || null

  if (newLocale !== cookieLocale) {
    if (newLocale) {
      response.cookies.set(COOKIE_NAME_LOCALE, newLocale)
    } else {
      response.cookies.delete(COOKIE_NAME_LOCALE)
    }
  }

  if (newLocale) {
    response.headers.append(HEADER_KEY_LOCALE, newLocale)
  } else {
    response.headers.delete(HEADER_KEY_LOCALE)
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let response = NextResponse.next()

  if (shouldExclude(pathname)) {
    return response
  }

  const localeInPathname = LOCALES.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (localeInPathname) {
    const pathnameWithoutLocale = pathname.replace(`/${localeInPathname}`, '')
    const newUrl = createUrl(
      `/${localeInPathname}${leadingSlashUrlPath(pathnameWithoutLocale)}`,
      request.nextUrl.searchParams
    )

    response = NextResponse.rewrite(new URL(newUrl, request.url))
    updateLocaleCookies(request, response, localeInPathname)
    return response
  }

  // Get locale with browser language preference
  const locale = getLocale(request, LOCALES)
  const newUrl = createUrl(
    `/${locale}${leadingSlashUrlPath(pathname)}`,
    request.nextUrl.searchParams
  )
  response =
    locale === DEFAULT_LOCALE
      ? NextResponse.rewrite(new URL(newUrl, request.url))
      : NextResponse.redirect(new URL(newUrl, request.url))

  updateLocaleCookies(request, response, locale)

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
