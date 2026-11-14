import type { ReactNode } from 'react';
import { Heart, Package, ShieldCheck } from 'lucide-react';
import { LogoMark } from '../../components/brand/Logo';
import { imgUrl } from '../../utils/constants';
import s from './Auth.module.css';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className={`container page ${s.wrap}`}>
      <aside className={s.brandPanel} aria-hidden>
        <img src={imgUrl('/demo/products/electric-sunburst-2.svg')} alt="" />
        <div className={s.brandContent}>
          <LogoMark size={52} />
          <h2>
            Sua música, <em>nosso palco.</em>
          </h2>
          <ul>
            <li>
              <Package size={18} /> Acompanhe seus pedidos
            </li>
            <li>
              <Heart size={18} /> Salve seus favoritos
            </li>
            <li>
              <ShieldCheck size={18} /> Compra protegida
            </li>
          </ul>
        </div>
      </aside>
      <section className={s.formPanel}>
        <h1>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        {children}
      </section>
    </div>
  );
}
