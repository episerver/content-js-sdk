import { trackRegistration } from '@/lib/fx';
import { connection } from 'next/server';

export default async function Page() {
  await connection();
  await trackRegistration();

  return <h1>Thanks for registration!</h1>;
}
