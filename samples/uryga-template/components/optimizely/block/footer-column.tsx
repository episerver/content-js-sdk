import { contentType, Infer } from '@episerver/cms-sdk'
import { NavItemContentType } from './nav-item'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'

export const FooterColumnContentType = contentType({
  key: 'FooterColumn',
  displayName: 'Footer Column',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
    },
    links: {
      type: 'array',
      displayName: 'Links',
      items: {
        type: 'content',
        allowedTypes: [NavItemContentType],
      },
      sortOrder: 10,
    },
  },
})

type Props = {
  opti: Infer<typeof FooterColumnContentType>
}

export default function FooterColumn({ opti }: Props) {
  const { title, links } = opti
  return (
    <div>
      <h3 className="mb-4 font-bold">{title}</h3>
      <nav className="grid gap-2">
        {links?.map((item, index) => (
          <OptimizelyComponent key={index} opti={item} />
        ))}
      </nav>
    </div>
  )
}
