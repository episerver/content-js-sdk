import type React from 'react' // Import React
import { contentType, Infer } from '@episerver/cms-sdk'
import { ServiceItemContentType } from './service-item'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'

export const ServicesBlockContentType = contentType({
  key: 'ServicesBlock',
  displayName: 'Services Block',
  baseType: '_component',
  properties: {
    services: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [ServiceItemContentType],
      },
      displayName: 'Services',
      localized: true,
      sortOrder: 10,
    },
  },
})

type Props = {
  opti: Infer<typeof ServicesBlockContentType>
}

export default function ServicesBlock({ opti }: Props) {
  const { services } = opti
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid gap-8 md:grid-cols-3">
        {services?.map((item, index) => (
          <OptimizelyComponent key={index} opti={item} />
        ))}
      </div>
    </section>
  )
}
