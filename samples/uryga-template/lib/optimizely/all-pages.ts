import { GraphClient } from '@episerver/cms-sdk'
import { mapPathWithoutLocale } from './language'

export const getAllPagesPaths = async () => {
  try {
    const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
      graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
    })

    const pageTypes = ['CMSPage', 'SEOExperience']
    const pathsResp = await client.request(ALL_PAGES_QUERY, {
      pageType: pageTypes,
    })

    const paths = (pathsResp._Content?.items as ContentItem[]) ?? []

    const filterPaths = paths?.filter(
      (path) => path && path._metadata?.url?.default !== null
    )

    const uniqueSlugs = new Set<string[]>() // Store slugs as arrays of strings

    filterPaths.forEach((path) => {
      const cleanPathSegments = mapPathWithoutLocale(
        path?._metadata?.url?.default ?? ''
      )
      // Convert the array of segments back to a string for Set uniqueness, then parse back
      // This handles cases where different paths might resolve to the same slug after mapping
      uniqueSlugs.add(cleanPathSegments)
    })

    // Convert Set of string arrays back to the required format
    return Array.from(uniqueSlugs).map((slugArray) => ({
      slug: slugArray,
    }))
  } catch (e) {
    console.error('Error generating static params:', e)
    return [] // Return an empty array on error to prevent build failures
  }
}

const ALL_PAGES_QUERY = `
  query AllPages($pageType: [String]) {
    _Content(where: { _metadata: { types: { in: $pageType } } }) {
      items {
        _metadata {
          displayName
          url {
            base
            hierarchical
            default
            type
          }
        }
      }
    }
  }
`

interface ContentUrl {
  base: string
  hierarchical: string
  default: string
  type: string
}

interface ContentMetadata {
  displayName: string
  url: ContentUrl
}

interface ContentItem {
  _metadata: ContentMetadata
}
