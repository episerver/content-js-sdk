import Image from 'next/image'
import { Card, CardContent } from '../../../components/ui/card'
import Link from 'next/link'
import { contentType, Infer } from '@episerver/cms-sdk'

export const PortfolioItemBlockContentType = contentType({
  key: 'PortfolioItemBlock',
  displayName: 'Portfolio Item',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
    },
    description: {
      type: 'string',
      displayName: 'Description',
      localized: true,
      sortOrder: 10,
    },
    imageUrl: {
      type: 'string',
      displayName: 'Image URL',
      sortOrder: 20,
    },
    link: {
      type: 'string',
      displayName: 'Link',
      sortOrder: 30,
    },
  },
})

type Props = {
  opti: Infer<typeof PortfolioItemBlockContentType>
}

export default function PortfolioItemBlock({
  opti: { title, imageUrl, link, description },
}: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Image
          src={imageUrl || '/placeholder.svg'}
          alt={title ?? ''}
          width={400}
          height={300}
          className="h-48 w-full object-cover"
        />
        <div className="p-4">
          <Link href={link ?? ''}>
            <h3 className="mb-2 font-semibold" data-epi-edit="title">
              {title}
            </h3>
          </Link>
          <p
            className="text-sm text-muted-foreground"
            data-epi-edit="description"
          >
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
