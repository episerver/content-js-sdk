import { contentType, Infer } from '@episerver/cms-sdk'
import Link from 'next/link'

export const NavItemContentType = contentType({
  key: 'NavItem',
  displayName: 'Nav Item',
  baseType: '_component',
  properties: {
    href: {
      type: 'string',
      displayName: 'Href',
    },
    label: {
      type: 'string',
      displayName: 'Label',
      localized: true,
    },
  },
})

type Props = {
  opti: Infer<typeof NavItemContentType>
}

export default function NavItem({ opti }: Props) {
  const { href, label } = opti
  return (
    <Link href={href ?? '/'} className="text-sm">
      {label}
    </Link>
  )
}
