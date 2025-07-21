'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { LOCALES } from '../../lib/optimizely/language'
import { Button } from '../ui/button'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  pl: 'Polski',
  sv: 'Svenska',
}

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLocaleChange = (newLocale: string) => {
    const currentPath = pathname

    const newPath = currentPath.includes(`/${currentLocale}`)
      ? currentPath.replace(`/${currentLocale}`, `/${newLocale}`)
      : `/${newLocale}/${currentPath}`

    router.push(newPath)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className={loc === currentLocale ? 'bg-accent' : ''}
            onClick={() => handleLocaleChange(loc)}
          >
            {LOCALE_NAMES[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
