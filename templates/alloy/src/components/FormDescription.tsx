type FormDescriptionProps = {
  description: string | null;
  previewAttributes: any;
};

export default function FormDescription({ description, previewAttributes }: FormDescriptionProps) {
  if (!description) return null;

  return (
    <div className='space-y-3 sm:space-y-4'>
      <p
        {...previewAttributes('Description')}
        className='text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl'
      >
        {description}
      </p>
    </div>
  );
}
