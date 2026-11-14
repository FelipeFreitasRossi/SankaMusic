import { HeroCarousel } from '../components/home/HeroCarousel';
import { Benefits, BrandStrip, CategoryGrid, Newsletter, PromoBanners } from '../components/home/HomeSections';
import { ProductShelf } from '../components/product/ProductCollections';
import { ErrorState } from '../components/ui/Feedback';
import { catalogService } from '../services/catalogService';
import { useAsync, useDocumentTitle } from '../hooks';

export default function HomePage() {
  useDocumentTitle();
  const { data, loading, error, reload } = useAsync(() => catalogService.showcase(), []);

  return (
    <>
      <HeroCarousel />
      <Benefits />
      <div className="container">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <ProductShelf
              eyebrow="Selecionados"
              title="Produtos em destaque"
              products={data?.featured || []}
              loading={loading}
              link={{ to: '/produtos', label: 'Ver todos' }}
            />
            <CategoryGrid categories={data?.categories || []} loading={loading} />
            <ProductShelf
              eyebrow="Aproveite"
              title="Ofertas especiais"
              products={data?.offers || []}
              loading={loading}
              link={{ to: '/ofertas', label: 'Todas as ofertas' }}
            />
            <PromoBanners />
            <ProductShelf
              eyebrow="Os favoritos dos músicos"
              title="Mais vendidos"
              products={data?.best_sellers || []}
              loading={loading}
              link={{ to: '/produtos?sort=best_sellers', label: 'Ver ranking' }}
            />
            <ProductShelf
              eyebrow="Acabou de chegar"
              title="Novidades"
              products={data?.newest || []}
              loading={loading}
              link={{ to: '/produtos?sort=newest', label: 'Ver lançamentos' }}
            />
            <BrandStrip brands={data?.brands || []} />
          </>
        )}
      </div>
      <Newsletter />
    </>
  );
}
