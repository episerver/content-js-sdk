import { Card, CardContent } from '../../../components/ui/card'
import { contentType, Infer } from '@episerver/cms-sdk'

export const StoryBlockContentType = contentType({
  key: 'StoryBlock',
  displayName: 'Story Block',
  baseType: '_component',
  properties: {
    story: {
      type: 'string',
      localized: true,
      displayName: 'Story',
      sortOrder: 10,
    },
    highlights: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Highlights',
      sortOrder: 20,
    },
  },
})

type Props = {
  opti: Infer<typeof StoryBlockContentType>
}

interface HighlightProps {
  text?: string
}

function Highlight({ text }: HighlightProps) {
  return (
    <div className="my-6 rounded-lg bg-[#009379] p-4 text-white">
      <p>{text}</p>
    </div>
  )
}

export default function StoryBlock({ opti }: Props) {
  const { story, highlights } = opti
  return (
    <section className="container mx-auto px-4 py-16">
      <Card className="border-none">
        <CardContent className="p-8">
          <div className="mx-auto max-w-3xl">
            <p
              className="mb-8 text-xl leading-relaxed text-[#2d2d2d]"
              data-epi-edit="story"
            >
              {story}
            </p>
            <div data-epi-edit="highlights">
              {highlights?.map((highlight, index) => (
                <Highlight key={index} text={highlight ?? ''} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
