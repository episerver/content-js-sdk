'use client'

const CLOUDINARY_REGEX =
  /^.+\.cloudinary\.com\/([^/]+)\/(?:(image|video|raw)\/)?(?:(upload|fetch|private|authenticated|sprite|facebook|twitter|youtube|vimeo)\/)?(?:(?:[^/]+\/[^,/]+,?)*\/)?(?:v(\d+|\w{1,2})\/)?([^.^\s]+)(?:\.(.+))?$/

export const extractCloudinaryPublicID = (link: string): string => {
  if (!link) {
    return ''
  }

  const parts = CLOUDINARY_REGEX.exec(link)

  if (parts && parts.length > 2) {
    const path = parts[parts.length - 2]
    const extension = parts[parts.length - 1]
    return `${path}${extension ? '.' + extension : ''}`
  }

  return link
}

const extractCloudName = (link: string): string => {
  if (!link) {
    return ''
  }

  const parts = CLOUDINARY_REGEX.exec(link)

  return parts && parts.length > 2 && parts[1] ? parts[1] : link
}

const getParams = (path: string, width: number, quality?: number) => {
  const params = path.toLowerCase().endsWith('.svg')
    ? []
    : [`f_auto`, `c_limit`, `w_${width || 'auto'}`, `q_${quality || 'auto'}`]

  if (params.length) {
    return `/${params.join(',')}/`
  } else {
    return '/'
  }
}

const paramFormats = ['f_', 'c_']

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (src.startsWith('https://res.cloudinary.com')) {
    // If the source is already formatted with parameters, return it unchanged
    if (paramFormats.some((f) => src.includes(f))) {
      return src
    }

    const publicId = extractCloudinaryPublicID(src)

    if (!publicId) {
      return src
    }

    const cloudName = extractCloudName(src)
    const params = getParams(publicId, width, quality)

    return `https://res.cloudinary.com/${cloudName}/image/upload${params}${publicId}`
  }

  return src
}
