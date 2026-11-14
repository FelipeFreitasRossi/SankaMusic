import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { SectionHeader } from '../ui/Navigation';
import s from './ProductCollections.module.css';

export function ProductGrid({ products, loading, skeletons = 8 }: { products: Product[]; loading?: boolean; skeletons?: number }) {
  return (
    <div className={s.grid}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/** Prateleira horizontal com rolagem por setas (desktop) e deslize (mobile). */
export function ProductShelf({
  eyebrow,
  title,
  products,
  loading,
  link,
}: {
  eyebrow?: string;
  title: string;
  products: Product[];
  loading?: boolean;
  link?: { to: string; label: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  if (!loading && !products.length) return null;
  return (
    <section className={s.shelf} aria-label={title}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        link={link}
        actions={
          <div className={s.arrows}>
            <button onClick={() => scroll(-1)} aria-label="Anterior">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll(1)} aria-label="Próximo">
              <ChevronRight size={20} />
            </button>
          </div>
        }
      />
      <div className={s.track} ref={track}>
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <div className={s.slide} key={i}>
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div className={s.slide} key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}
