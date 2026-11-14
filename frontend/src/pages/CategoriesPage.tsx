import { Link } from 'react-router-dom';
import { ChevronRight, Tag } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useDocumentTitle } from '../hooks';
import { CategoryIcon } from '../components/brand/CategoryIcon';
import { Breadcrumbs } from '../components/ui/Navigation';
import { Spinner } from '../components/ui/Feedback';
import { imgUrl } from '../utils/constants';
import s from './Pages.module.css';

export default function CategoriesPage() {
  useDocumentTitle('Categorias');
  const { categories, categoriesLoaded } = useStore();
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Categorias' }]} />
      <h1 className="page-title">Categorias</h1>
      {!categoriesLoaded ? (
        <Spinner />
      ) : (
        <div className={s.catList}>
          <Link to="/ofertas" className={`${s.catRow} ${s.catOffer}`}>
            <span className={s.catRowIcon}>
              <Tag size={22} />
            </span>
            <span>
              <b>Ofertas</b>
              <small>Produtos com preço promocional</small>
            </span>
            <ChevronRight size={20} />
          </Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/categoria/${c.slug}`} className={s.catRow}>
              <img src={imgUrl(c.image || `/demo/categories/${c.slug}.svg`)} alt="" loading="lazy" />
              <span className={s.catRowIcon}>
                <CategoryIcon name={c.icon} size={22} />
              </span>
              <span>
                <b>{c.name}</b>
                <small>{c.product_count ?? 0} produtos</small>
              </span>
              <ChevronRight size={20} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
