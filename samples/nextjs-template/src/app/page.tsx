import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main className="under-construction">
        <h1>JS SDK demo page</h1>
        <p>
          To see some content in this site, create content in the CMS and go to
          <code>/[locale]/[slug]</code>, where locale is the localization (for
          example "en") and slug is the path of the content
        </p>
      </main>
    </>
  );
}
