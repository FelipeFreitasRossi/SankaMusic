import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Headphones, Mail, ShieldCheck, Truck } from 'lucide-react';
import type { Category } from '../../types';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { catalogService } from '../../services/catalogService';
import { errorMessage } from '../../services/api';
import { brl, isValidEmail } from '../../utils/format';
import { imgUrl } from '../../utils/constants';
import { CategoryIcon } from '../brand/CategoryIcon';
import { SectionHeader } from '../ui/Navigation';
import { Skeleton } from '../ui/Feedback';
import s from './Home.module.css';

export function Benefits() {
  const { config } = useStore();
  const items = [
    { icon: Truck, title: 'Entrega para todo o Brasil', text: config.free_shipping_threshold > 0 ? `Frete grátis acima de ${brl(config.free_shipping_threshold)}` : 'Calcule o frete pelo CEP' },
    { icon: CreditCard, title: config.max_installments > 1 ? `Até ${config.max_installments}x sem juros` : 'Pagamento facilitado', text: 'Pagamento processado pelo Mercado Pago' },
    { icon: ShieldCheck, title: 'Compra segura', text: 'Pagamento em ambiente protegido' },
    { icon: Headphones, title: 'Atendimento especializado', text: 'Fale com quem entende de música' },
  ];
  return (
    <section className={s.benefits} aria-label="Benefícios">
      <div className={`container ${s.benefitsGrid}`}>
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className={s.benefit}>
            <span className={s.benefitIcon}>
              <Icon size={22} />
            </span>
            <div>
              <b>{title}</b>
              <small>{text}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryGrid({ categories, loading }: { categories: Category[]; loading?: boolean }) {
  return (
    <section className={s.section}>
      <SectionHeader eyebrow="Departamentos" title="Compre por categoria" link={{ to: '/categorias', label: 'Ver todas' }} />
      <div className={s.catGrid}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={210} radius={18} />)
          : categories.map((c, i) => (
              <Link key={c.id} to={`/categoria/${c.slug}`} className={`${s.catCard} ${i === 0 ? s.catFeatured : ''}`}>
                <img src={imgUrl(c.image || `/demo/categories/${c.slug}.svg`)} alt="" loading="lazy" />
                <span className={s.catOverlay} />
                <span className={s.catIcon}>
                  <CategoryIcon name={c.icon} size={18} />
                </span>
                <span className={s.catLabel}>
                  <b>{c.name}</b>
                  <small>
                    {c.product_count ?? 0} produtos <ArrowRight size={14} />
                  </small>
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}

export function PromoBanners() {
  return (
    <section className={`${s.section} ${s.promos}`}>
      <Link to="/ofertas" className={`${s.promo} ${s.promoOrange}`}>
        <div>
          <span className={s.promoTag}>Ofertas</span>
          <h3>Preços especiais em instrumentos selecionados</h3>
          <span className={s.promoLink}>
            Ver ofertas <ArrowRight size={16} />
          </span>
        </div>
        <img src={imgUrl('/demo/products/electric-orange-1.svg')} alt="" loading="lazy" />
      </Link>
      <Link to="/categoria/caixas-de-som" className={`${s.promo} ${s.promoDark}`}>
        <div>
          <span className={s.promoTag}>Som ao vivo</span>
          <h3>Caixas ativas e mesas para eventos e igrejas</h3>
          <span className={s.promoLink}>
            Conhecer linha <ArrowRight size={16} />
          </span>
        </div>
        <img src={imgUrl('/demo/products/speaker-black-2.svg')} alt="" loading="lazy" />
      </Link>
    </section>
  );
}

export function BrandStrip({ brands }: { brands: string[] }) {
  if (!brands.length) return null;
  return (
    <section className={s.section} aria-label="Marcas">
      <SectionHeader eyebrow="Marcas" title="Marcas disponíveis" />
      <div className={s.brands}>
        {brands.map((b) => (
          <Link key={b} to={`/produtos?brand=${encodeURIComponent(b)}`} className={s.brand}>
            {b}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await catalogService.newsletter(email.trim());
      toast.success(r.detail);
      setEmail('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={s.newsletter}>
      <div className={`container ${s.newsInner}`}>
        <div className={s.newsText}>
          <span className={s.newsIcon}>
            <Mail size={26} />
          </span>
          <div>
            <h2>Receba novidades e ofertas</h2>
            <p>Lançamentos, dicas de equipamento e promoções exclusivas no seu e-mail.</p>
          </div>
        </div>
        <form className={s.newsForm} onSubmit={submit} noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            maxLength={160}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Quero receber'}
          </button>
          {error && (
            <span className={s.newsError} role="alert">
              {error}
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
