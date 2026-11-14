import { useState, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imgUrl } from '../../utils/constants';
import s from './ProductDetail.module.css';

/** Galeria com miniaturas, zoom no hover (desktop) e deslize (mobile). */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : [''];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const go = (d: number) => setActive((i) => (i + d + list.length) % list.length);

  return (
    <div className={s.gallery}>
      <div className={s.thumbs} role="tablist" aria-label="Imagens do produto">
        {list.map((src, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Imagem ${i + 1}`}
            className={`${s.thumb} ${i === active ? s.thumbActive : ''}`}
            onClick={() => setActive(i)}
          >
            <img src={imgUrl(src)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className={s.stage} onMouseMove={move} onMouseLeave={() => setZoom(null)}>
        <img
          src={imgUrl(list[active])}
          alt={`${name} — imagem ${active + 1} de ${list.length}`}
          className={s.mainImg}
          style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {list.length > 1 && (
          <>
            <button className={`${s.navBtn} ${s.prev}`} onClick={() => go(-1)} aria-label="Imagem anterior">
              <ChevronLeft size={20} />
            </button>
            <button className={`${s.navBtn} ${s.next}`} onClick={() => go(1)} aria-label="Próxima imagem">
              <ChevronRight size={20} />
            </button>
            <div className={s.dotsMobile} aria-hidden>
              {list.map((_, i) => (
                <span key={i} className={i === active ? s.dotOn : undefined} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
