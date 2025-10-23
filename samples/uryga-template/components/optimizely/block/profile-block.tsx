import Image from 'next/image'
import { Card, CardContent } from '../../../components/ui/card'
import { cva } from 'class-variance-authority'
import { contentType, displayTemplate, Infer } from '@episerver/cms-sdk'

export const ProfileBlockContentType = contentType({
  key: 'ProfileBlock',
  displayName: 'Profile Block',
  baseType: '_component',
  properties: {
    imageSrc: {
      type: 'string',
      displayName: 'Image Source',
      sortOrder: 10,
    },
    name: {
      type: 'string',
      displayName: 'Name',
      localized: true,
      sortOrder: 0,
    },
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
      sortOrder: 10,
    },
    bio: {
      type: 'string',
      displayName: 'Bio',
      localized: true,
      sortOrder: 20,
    },
  },
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
})

export const ProfileBlockDisplayTemplate = displayTemplate({
  key: 'ProfileBlock',
  isDefault: true,
  displayName: 'Profile Block',
  baseType: '_component',
  settings: {
    colorScheme: {
      editor: 'select',
      displayName: 'Color scheme',
      sortOrder: 10,
      choices: {
        default: {
          displayName: 'Default',
          sortOrder: 10,
        },
        primary: {
          displayName: 'Primary',
          sortOrder: 20,
        },
        secondary: {
          displayName: 'Secondary',
          sortOrder: 30,
        },
      },
    },
  },
})

type Props = {
  opti: Infer<typeof ProfileBlockContentType>
  displaySettings?: Record<string, string>
}

const backgroundVariants = cva('container mx-auto px-4 py-16', {
  variants: {
    colorScheme: {
      default: 'border-none bg-[#f9e6f0] text-[#2d2d2d]',
      primary: 'border-none bg-primary text-white',
      secondary: 'border-none bg-secondary text-secondary-foreground',
    },
  },
  defaultVariants: {
    colorScheme: 'default',
  },
})

export default function ProfileBlock({
  opti: { imageSrc, name, title, bio },
  displaySettings,
}: Props) {
  const colorScheme = displaySettings?.colorScheme || 'default'

  return (
    <section className="container mx-auto px-4 py-16">
      <Card
        className={backgroundVariants({
          colorScheme: colorScheme as 'default' | 'primary' | 'secondary',
        })}
      >
        <CardContent className="p-8">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <Image
                src={imageSrc || '/placeholder.svg'}
                alt={title ?? ''}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold" data-epi-edit="name">
                {name}
              </h1>
              <p className="text-xl" data-epi-edit="title">
                {title}
              </p>
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-semibold">Bio:</h2>
                <p className="leading-relaxed" data-epi-edit="bio">
                  {bio}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
