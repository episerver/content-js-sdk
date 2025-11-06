// lib\utils.ts
import { ReadonlyURLSearchParams } from 'next/navigation'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams
) => {
  const paramsString = params.toString()
  const queryString = `${paramsString.length ? '?' : ''}${paramsString}`

  return `${pathname}${queryString}`
}

export const leadingSlashUrlPath = (pathname: string) => {
  return `${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
