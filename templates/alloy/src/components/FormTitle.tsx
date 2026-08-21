type FormTitleProps = {
  title: string | null;
  previewAttributes: any;
};

export default function FormTitle({ title, previewAttributes }: FormTitleProps) {
  if (!title) return null;

  // `h2`, not `h1` — the form is a block on a page that already has a heading.
  return (
    <h2
      {...previewAttributes('Title')}
      className='text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl'
    >
      {title}
    </h2>
  );
}
