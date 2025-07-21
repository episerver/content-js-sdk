import { AllBlocksContentTypes } from '../../../lib/optimizely/content-types'
import { contentType, Infer } from '@episerver/cms-sdk'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'

export const CMSPageContentType = contentType({
  key: 'CMSPage',
  displayName: 'CMS Page',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
      sortOrder: 10,
    },
    shortDescription: {
      type: 'string',
      displayName: 'Short Description',
      localized: true,
      sortOrder: 20,
    },
    keywords: {
      type: 'string',
      displayName: 'Keywords',
      localized: true,
      sortOrder: 30,
    },
    blocks: {
      type: 'array',
      localized: true,
      displayName: 'Blocks',
      sortOrder: 40,
      items: {
        type: 'content',
        allowedTypes: AllBlocksContentTypes,
      },
    },
  },
})

type Props = {
  opti: Infer<typeof CMSPageContentType>
}

export default function CMSPage({ opti }: Props) {
  return (
    <main>
      {opti.blocks?.map((section, i) => (
        <OptimizelyComponent key={i} opti={section} />
      ))}
    </main>
  )
}
