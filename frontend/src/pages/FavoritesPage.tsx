import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { favoriteService } from '../services/accountService';
import { catalogService } from '../services/catalogService';
import { useDocumentTitle } from '../hooks';
import type { Product } from '../types';
import { ProductGrid } from '../components/product/ProductCollections';
import { EmptyState } from '../components/ui/Feedback';
import { Breadcrumbs } from '../components/ui/Navigation';
import { Button } from '../components/ui/Button';
import { pluralize } from '../utils/format';

export default function FavoritesPage() {
  useDocumentTitle('Favoritos');
  const { ids } = useFavorites();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    // Já carregados? apenas filtra (ex.: item removido) — evita nova requisição
    const known = products.filter((p) => ids.includes(p.id));
    if (known.length === ids.length && products.length) {
      setProducts(known);
      return;
    }
    setLoading(true);
    const load = user
      ? favoriteService.list()
      : Promise.all(
          ids.slice(0, 60).map((id) =>
            catalogService
              .product(id)
              .then((r) => r.product)
              .catch(() => null),
          ),
        ).then((list) => list.filter((p): p is Product => !!p));
    load
      .then((list) => alive && setProducts(list.filter((p) => ids.includes(p.id))))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, user]);

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Favoritos' }]} />
      <h1 className="page-title">Meus favoritos</h1>
      {!loading && !products.length ? (
        <EmptyState
          icon={<Heart size={36} />}
          title="Nenhum favorito ainda"
          text="Toque no coração dos produtos para salvá-los aqui e comparar depois."
          action={{ label: 'Descobrir produtos', to: '/produtos' }}
        />
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 20 }}>
            {pluralize(ids.length, 'produto salvo', 'produtos salvos')}
            {!user && ' neste dispositivo. '}
            {!user && (
              <Button variant="ghost" size="sm" to="/entrar?next=/favoritos">
                Entre para salvar na sua conta
              </Button>
            )}
          </p>
          <ProductGrid products={products} loading={loading} skeletons={Math.min(ids.length, 8)} />
        </>
      )}
    </div>
  );
}
