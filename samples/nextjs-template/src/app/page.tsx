import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main className="under-construction">
        <h1>JS SDK demo page</h1>
        <p>
          This page is under construction. In the meantime, you can visit the{' '}
          <Link href="/static-page">static version</Link>
        </p>
      </main>
    </>
  );
}
