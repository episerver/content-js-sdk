import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS } from '../../../../lib/store/catalog/fixtures';
import type { Accessory, Bike } from '../../../../lib/store/catalog/types';
import { searchProducts } from '../../../../lib/store/domain';
import { formatUsd } from '../../../../lib/store/format';
import { ProductArt } from '../../../../components/store/ProductArt';
import { AddToCartPanel } from './AddToCartPanel';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find(p => p.id === slug);
  return { title: product ? `Stride — ${product.name}` : 'Stride — Product not found' };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = PRODUCTS.find(p => p.id === slug);
  if (!product) notFound();

  const isBike = product.category === 'bike';
  const bikeProduct = isBike ? (product as Bike) : null;
  const accessoryProduct = !isBike ? (product as Accessory) : null;

  // Display-only: compatible accessories, computed by the same domain engine
  // the /api/store/search route uses (single compatibility definition, §1).
  const compatibleAccessories =
    bikeProduct ?
      searchProducts({ category: 'accessory', compatibleWithProductId: bikeProduct.id }).matches
    : [];

  return (
    <div data-testid={`product-page-${product.id}`}>
      <nav className='mb-6 text-xs text-foreground2'>
        <Link href='/store' className='hover:text-key1'>
          Store
        </Link>
        <span className='mx-2'>/</span>
        <span className='font-semibold text-foreground'>{product.name}</span>
      </nav>

      <div className='grid grid-cols-1 gap-10 lg:grid-cols-2'>
        <ProductArt product={product} className='h-80 rounded-2xl lg:h-[28rem]' iconSize={140} />

        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-key1'>
            {bikeProduct ? `${bikeProduct.discipline} bike` : accessoryProduct!.kind}
          </p>
          <h1 className='mt-2 text-3xl font-bold tracking-tight'>{product.name}</h1>
          <p className='mt-3 text-2xl font-bold tabular-nums'>{formatUsd(product.priceUsd)}</p>
          <p className='mt-4 text-foreground2'>{product.description}</p>

          <dl className='mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
            <Spec label='Weight' value={`${product.weightKg} kg`} />
            <Spec label='Style' value={product.style} />
            <Spec label='Colors' value={product.colors.join(', ')} />
            {bikeProduct && <Spec label='Terrain' value={bikeProduct.terrains.join(', ')} />}
            {bikeProduct?.rangeKm !== undefined && (
              <Spec label='Range' value={`${bikeProduct.rangeKm} km`} />
            )}
            {bikeProduct && bikeProduct.mounts.length > 0 && (
              <Spec label='Mounts' value={bikeProduct.mounts.join(', ')} />
            )}
            {accessoryProduct && (
              <Spec label='Fits' value={accessoryProduct.compatibleDisciplines.join(', ')} />
            )}
            {accessoryProduct?.requiresMount && (
              <Spec label='Requires' value={`${accessoryProduct.requiresMount} on the bike`} />
            )}
            <Spec label='Availability' value={product.inStock ? 'In stock' : 'Out of stock'} />
          </dl>

          <AddToCartPanel
            productId={product.id}
            category={product.category}
            inStock={product.inStock}
            variants={bikeProduct?.variants.map(v => ({ ...v }))}
            sizing={bikeProduct?.sizing.map(r => ({ ...r }))}
          />
        </div>
      </div>

      {bikeProduct && (
        <section className='mt-14'>
          <h2 className='text-xl font-bold'>Size guide</h2>
          <div className='card mt-4 overflow-x-auto bg-white/80'>
            <table className='w-full text-left text-sm' data-testid='sizing-table'>
              <thead>
                <tr className='border-b border-foreground/10 text-xs uppercase tracking-wider text-foreground2'>
                  <th className='px-5 py-3'>Frame size</th>
                  <th className='px-5 py-3'>Rider height</th>
                  <th className='px-5 py-3'>Availability</th>
                </tr>
              </thead>
              <tbody>
                {bikeProduct.sizing.map(row => {
                  const variant = bikeProduct.variants.find(v => v.frameSize === row.frameSize);
                  return (
                    <tr key={row.frameSize} className='border-b border-foreground/5 last:border-0'>
                      <td className='px-5 py-3 font-semibold'>{row.frameSize}</td>
                      <td className='px-5 py-3 text-foreground2'>
                        {row.riderHeightMinCm}–{row.riderHeightMaxCm} cm
                      </td>
                      <td className='px-5 py-3'>
                        {variant ?
                          variant.inStock ?
                            <span className='font-semibold text-key1'>In stock</span>
                          : <span className='text-foreground2'>Out of stock</span>
                        : <span className='text-foreground2'>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {compatibleAccessories.length > 0 && (
        <section className='mt-14'>
          <h2 className='text-xl font-bold'>Gear that fits this bike</h2>
          <div className='mt-4 grid grid-cols-2 gap-6 md:grid-cols-4'>
            {compatibleAccessories.map(m => (
              <Link
                key={m.product.id}
                href={`/store/products/${m.product.id}`}
                className='card group overflow-hidden bg-white/80 transition-shadow hover:shadow-lg'
              >
                <ProductArt product={m.product} className='h-28 w-full' iconSize={40} />
                <div className='p-4'>
                  <p className='truncate text-sm font-semibold group-hover:text-key1'>
                    {m.product.name}
                  </p>
                  <p className='mt-1 text-xs text-foreground2'>{formatUsd(m.product.priceUsd)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col border-b border-foreground/5 pb-2'>
      <dt className='text-xs uppercase tracking-wider text-foreground2'>{label}</dt>
      <dd className='mt-0.5 font-semibold capitalize'>{value}</dd>
    </div>
  );
}
