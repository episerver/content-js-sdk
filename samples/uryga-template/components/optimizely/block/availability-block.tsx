import { Card, CardContent } from '../../../components/ui/card'
import { contentType, Infer } from '@episerver/cms-sdk'

export const AvailabilityBlockContentType = contentType({
  key: 'AvailabilityBlock',
  displayName: 'Availability Block',
  baseType: '_component',
  properties: {
    availability: {
      type: 'string',
      displayName: 'Availability',
      localized: true,
    },
    projectTypes: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Project Types',
      localized: true,
      sortOrder: 10,
    },
  },
})

type Props = {
  opti: Infer<typeof AvailabilityBlockContentType>
}

export default function AvailabilityBlock({ opti }: Props) {
  return (
    <section className="container mx-auto px-4 py-16">
      <Card className="border-none">
        <CardContent className="p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <p
              className="leading-relaxed text-[#2d2d2d]"
              data-epi-edit="availability"
            >
              {opti.availability}
            </p>
            <div>
              <p className="leading-relaxed text-[#2d2d2d]">
                Projects include:
              </p>
              <ul
                className="mt-2 list-inside list-disc space-y-1"
                data-epi-edit="projectTypes"
              >
                {opti.projectTypes?.map((type, index) => (
                  <li key={index} className="text-[#2d2d2d]">
                    {type}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
