import { cn } from '../../../lib/utils'
import { contentType, Infer } from '@episerver/cms-sdk'

export const HeroBlockContentType = contentType({
  key: 'HeroBlock',
  displayName: 'Hero Block',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      localized: true,
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
      localized: true,
      sortOrder: 10,
    },
    showDecoration: {
      type: 'boolean',
      displayName: 'Show Decoration',
      defaultValue: true,
      localized: true,
      sortOrder: 25,
    },
    decorationColorsPrimary: {
      type: 'string',
      displayName: 'Decoration Color Primary',
      defaultValue: '#009379',
      localized: true,
      sortOrder: 30,
    },
    decorationColorsSecondary: {
      type: 'string',
      displayName: 'Decoration Color Secondary',
      defaultValue: '#ffd285',
      localized: true,
      sortOrder: 35,
    },
  },
})

type Props = {
  opti: Infer<typeof HeroBlockContentType>
}

export default function HeroBlock({
  opti: {
    title,
    subtitle,
    showDecoration = true,
    decorationColorsPrimary = '#009379',
    decorationColorsSecondary = '#ffd285',
  },
}: Props) {
  return (
    <section className="container relative mx-auto px-4 pb-16 pt-20">
      <div className={cn('flex flex-col', { 'sm:pr-60': showDecoration })}>
        <h1
          className="mb-4 w-full max-w-xl text-4xl font-bold md:text-6xl"
          data-epi-edit="title"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mb-8 max-w-xl text-xl text-muted-foreground"
            data-epi-edit="subtitle"
          >
            {subtitle}
          </p>
        )}
      </div>
      {showDecoration && (
        <div className="absolute right-20 top-10 hidden sm:block">
          <div className="relative h-48 w-48 lg:h-72 lg:w-72">
            <div
              className="absolute right-0 h-32 w-32 rounded-full lg:h-56 lg:w-56"
              data-epi-edit="decorationColorsPrimary"
              style={{ backgroundColor: decorationColorsPrimary ?? '#009379' }}
            />
            <div
              className="absolute bottom-0 left-0 h-40 w-40 rounded-full lg:h-60 lg:w-60"
              data-epi-edit="decorationColorsSecondary"
              style={{
                backgroundColor: decorationColorsSecondary ?? '#ffd285',
              }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
