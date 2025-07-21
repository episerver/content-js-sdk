import { contentType, Infer } from '@episerver/cms-sdk'
import { TestimonialItemBlockContentType } from './testimonial-item-block'
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'

export const TestimonialsBlockContentType = contentType({
  key: 'TestimonialsBlock',
  displayName: 'Testimonials Block',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      localized: true,
      displayName: 'Title',
      sortOrder: 0,
    },
    testimonials: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [TestimonialItemBlockContentType],
      },
      displayName: 'Testimonials',
      localized: true,
      sortOrder: 10,
    },
  },
})

type Props = {
  opti: Infer<typeof TestimonialsBlockContentType>
}

export default function TestimonialsBlock({
  opti: { title, testimonials },
}: Props) {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="mb-12 text-3xl font-bold" data-epi-edit="title">
        {title}
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {testimonials?.map((item, index) => (
          <OptimizelyComponent key={index} opti={item} />
        ))}
      </div>
    </section>
  )
}
