import { Link } from 'react-router-dom';
import { Clock, Lock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useStore } from '../../contexts/StoreContext';
import { STORE_INFO } from '../../utils/store';
import { DEMO_MODE } from '../../utils/constants';
import s from './Footer.module.css';

export function Footer() {
  const { categories } = useStore();
  const year = new Date().getFullYear();
  const social = Object.entries(STORE_INFO.social).filter(([, url]) => url);
  const contact = [
    STORE_INFO.phone && { icon: Phone, text: STORE_INFO.phone },
    STORE_INFO.email && { icon: Mail, text: STORE_INFO.email },
    STORE_INFO.address && { icon: MapPin, text: STORE_INFO.address },
    STORE_INFO.openingHours && { icon: Clock, text: STORE_INFO.openingHours },
  ].filter(Boolean) as { icon: typeof Phone; text: string }[];

  return (
    <footer className={s.footer}>
      <div className={`container ${s.grid}`}>
        <div className={s.brandCol}>
          <Logo />
          <p className={s.tagline}>Instrumentos musicais e equipamentos de áudio para quem vive a música — do primeiro acorde ao palco.</p>
          {social.length > 0 && (
            <div className={s.social}>
              {social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                  {name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className={s.title}>Categorias</h3>
          <ul className={s.list}>
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={s.title}>Ajuda</h3>
          <ul className={s.list}>
            <li><Link to="/info/como-comprar">Como comprar</Link></li>
            <li><Link to="/info/trocas-e-devolucoes">Trocas e devoluções</Link></li>
            <li><Link to="/conta/pedidos">Acompanhar pedido</Link></li>
            <li><Link to="/conta">Minha conta</Link></li>
          </ul>
        </div>

        <div>
          <h3 className={s.title}>Institucional</h3>
          <ul className={s.list}>
            <li><Link to="/info/sobre">Sobre a Sanka Music</Link></li>
            <li><Link to="/info/politica-de-privacidade">Política de privacidade</Link></li>
            <li><Link to="/info/termos">Termos de uso</Link></li>
          </ul>
          {contact.length > 0 && (
            <ul className={`${s.list} ${s.contact}`}>
              {contact.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={15} /> {text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`container ${s.trust}`}>
        <span>
          <Lock size={16} /> Site protegido com conexão segura (HTTPS em produção)
        </span>
        <span>
          <ShieldCheck size={16} /> Pagamentos processados pelo provedor — a loja não armazena dados de cartão
        </span>
      </div>

      <div className={s.bottom}>
        <div className={`container ${s.bottomInner}`}>
          <span>
            © {year} {STORE_INFO.legalName || STORE_INFO.name}
            {STORE_INFO.cnpj && ` — CNPJ ${STORE_INFO.cnpj}`}. Todos os direitos reservados.
          </span>
          {DEMO_MODE && <span className={s.demo}>Loja em demonstração: produtos e preços fictícios.</span>}
        </div>
      </div>
    </footer>
  );
}
