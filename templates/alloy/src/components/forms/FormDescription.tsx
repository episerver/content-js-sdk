type FormDescriptionProps = {
  description: string | null;
  previewAttributes: any;
};

export default function FormDescription({ description, previewAttributes }: FormDescriptionProps) {
  if (!description) return null;

  return (
    <p
      {...previewAttributes('Description')}
      className='text-base leading-relaxed text-gray-700'
    >
      {description}
    </p>
  );
}
