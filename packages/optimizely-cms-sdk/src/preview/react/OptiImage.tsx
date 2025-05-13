'use client';

import { ComponentProps } from 'react';
import { useSecuredImage } from './useSecuredImage';

type ImgProps = ComponentProps<'img'> & { src: string };

export function OptiImage({ src, ...rest }: ImgProps) {
  const securedSrc = useSecuredImage(src);

  return <img src={securedSrc} {...rest} />;
}
