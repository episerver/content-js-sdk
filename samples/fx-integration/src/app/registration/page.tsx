import { trackRegistration } from '@/lib/fx';

export default async function Page() {
  await trackRegistration();

  return <h1>Thanks for registration!</h1>;
}
