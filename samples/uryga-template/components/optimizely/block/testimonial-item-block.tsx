import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../components/ui/avatar'
import { contentType, Infer } from '@episerver/cms-sdk'

export const TestimonialItemBlockContentType = contentType({
  key: 'TestimonialItemBlock',
  displayName: 'Testimonial Item Block',
  baseType: '_component',
  properties: {
    fullName: {
      type: 'string',
      localized: true,
      displayName: 'Full Name',
      sortOrder: 10,
    },
    position: {
      type: 'string',
      localized: true,
      displayName: 'Position',
      sortOrder: 20,
    },
    avatarSrc: {
      type: 'string',
      displayName: 'Avatar Src',
      sortOrder: 40,
    },
    content: {
      type: 'string',
      localized: true,
      displayName: 'Content',
      sortOrder: 29,
    },
  },
})

type Props = {
  opti: Infer<typeof TestimonialItemBlockContentType>
}

export default function TestimonialItemBlock({
  opti: { fullName, position, avatarSrc, content },
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage
              src={avatarSrc ?? './placeholder.svg'}
              alt={fullName ?? ''}
            />
            <AvatarFallback data-epi-edit="fullName">
              {fullName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm font-medium" data-epi-edit="fullName">
              {fullName}
            </CardTitle>
            <p
              className="text-sm text-muted-foreground"
              data-epi-edit="position"
            >
              {position}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-epi-edit="content">
          {content}
        </p>
      </CardContent>
    </Card>
  )
}
