import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import type React from 'react' // Import React
import Image from 'next/image'
import { contentType, Infer } from '@episerver/cms-sdk'

export const ServiceItemContentType = contentType({
  key: 'ServiceItem',
  displayName: 'Service Item',
  baseType: '_component',
  properties: {
    icon: {
      type: 'string',
      displayName: 'Icon',
      sortOrder: 20,
    },
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
      sortOrder: 0,
    },
    description: {
      type: 'string',
      displayName: 'Description',
      localized: true,
      sortOrder: 10,
    },
  },
})

type Props = {
  opti: Infer<typeof ServiceItemContentType>
}

export default function ServiceItem({
  opti: { icon, title, description },
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4">
          <Image
            src={icon ?? './placeholder.svg'}
            alt={title ?? ''}
            width={50}
            height={50}
          />
        </div>
        <CardTitle data-epi-edit="title">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-epi-edit="description">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
