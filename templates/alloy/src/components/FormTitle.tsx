import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type FormTitleProps = {
  title: string | null;
  previewAttributes: any;
};

export default function FormTitle({ title, previewAttributes }: FormTitleProps) {
  if (!title) return null;

  return (
    <div className='space-y-3 sm:space-y-4'>
      <h1
        {...previewAttributes('Title')}
        className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl'
      >
        {title}
      </h1>
    </div>
  );
}
