import Image from 'next/image'
import { contentType, Infer } from '@episerver/cms-sdk'

export const LogoItemBlockContentType = contentType({
  key: 'LogoItemBlock',
  displayName: 'Logo Item Block',
  baseType: '_component',
  properties: {
    src: {
      type: 'string',
      displayName: 'Image Source',
    },
    alt: {
      type: 'string',
      displayName: 'Image Alt Text',
    },
  },
})

type Props = {
  opti: Infer<typeof LogoItemBlockContentType>
}

export default function LogoItemBlock({ opti: { src, alt } }: Props) {
  return (
    <div className="flex items-center">
      <Image
        src={src || '/placeholder.svg'}
        alt={alt || ''}
        width={100}
        height={40}
      />
    </div>
  )
}
