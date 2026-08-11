import type { Metadata } from 'next';
import { CartClient } from './CartClient';

export const metadata: Metadata = { title: 'Stride — Cart' };

export default function CartPage() {
  return <CartClient />;
}
