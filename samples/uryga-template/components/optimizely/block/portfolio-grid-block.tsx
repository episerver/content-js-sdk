import { contentType, Infer } from '@episerver/cms-sdk'
import { PortfolioItemBlockContentType } from './portfolio-item-block'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'

export const PortfolioGridBlockContentType = contentType({
  key: 'PortfolioGridBlock',
  displayName: 'Portfolio Grid Block',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    items: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [PortfolioItemBlockContentType],
      },
      displayName: 'Items',
      localized: true,
      sortOrder: 10,
    },
  },
  compositionBehaviors: ['sectionEnabled'],
})

type Props = {
  opti: Infer<typeof PortfolioGridBlockContentType>
}

export default function PortfolioGridBlock({ opti: { title, items } }: Props) {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="mb-12 text-3xl font-bold" data-epi-edit="title">
        {title}
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {items?.map((item, index) => (
          <OptimizelyComponent key={index} opti={item} />
        ))}
      </div>
    </section>
  )
}
