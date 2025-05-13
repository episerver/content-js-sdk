'use client';

import Image, { ImageProps } from 'next/image';
import { useSecuredImage } from './useSecuredImage';

type Props = Omit<ImageProps, 'src'> & { src: string };

export function OptiNextImage({ src, ...rest }: Props) {
  const securedSrc = useSecuredImage(src);

  return <Image src={securedSrc} {...rest} />;
}
