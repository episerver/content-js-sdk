import { contentType, Infer } from '@episerver/cms-sdk'
import Image from 'next/image'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'
import { NavItemContentType } from '../block/nav-item'
import Link from 'next/link'
import { LanguageSwitcher } from '../../../components/layout/language-switcher'
import { Button } from '../../../components/ui/button'

export const HeaderContentType = contentType({
  key: 'Header',
  displayName: 'Header',
  baseType: '_page',
  properties: {
    logo: {
      type: 'string',
      displayName: 'Logo',
      sortOrder: 0,
    },
    navItems: {
      type: 'array',
      displayName: 'Nav Items',
      localized: true,
      sortOrder: 10,
      items: {
        type: 'content',
        allowedTypes: [NavItemContentType],
      },
    },
    ctaText: {
      type: 'string',
      displayName: 'CTA Text',
      localized: true,
      sortOrder: 20,
    },
    ctaHref: {
      type: 'string',
      displayName: 'CTA Link',
      sortOrder: 30,
    },
  },
})

type Props = {
  opti: Infer<typeof HeaderContentType>
  locale: string
}

export default function Header({
  opti: { logo, navItems, ctaHref, ctaText },
  locale,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold lg:min-w-[150px]">
            <Image src={logo ?? ''} width={50} height={50} alt="logo" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems?.map((navItem, index) => (
              <OptimizelyComponent key={index} opti={navItem} />
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <Button variant="outline" asChild>
              <Link href={ctaHref ?? '/'}>{ctaText}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
