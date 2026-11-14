import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { imgUrl } from '../../utils/constants';
import s from './Home.module.css';

/** Banners de demonstração — edite textos, links e imagens aqui. */
const SLIDES = [
  {
    eyebrow: 'Guitarras & Amplificadores',
    title: (
      <>
        Seu timbre começa <em>aqui.</em>
      </>
    ),
    text: 'Guitarras elétricas, amplificadores e pedais selecionados para estudo, estúdio e palco.',
    cta: { label: 'Ver guitarras', to: '/categoria/guitarras' },
    secondary: { label: 'Amplificadores', to: '/categoria/amplificadores' },
    image: '/demo/banners/hero-guitarras.svg',
  },
  {
    eyebrow: 'Home studio',
    title: (
      <>
        Grave com qualidade <em>profissional.</em>
      </>
    ),
    text: 'Microfones, interfaces de áudio e fones de referência para montar o seu estúdio.',
    cta: { label: 'Montar meu estúdio', to: '/categoria/equipamentos-de-audio' },
    secondary: { label: 'Microfones', to: '/categoria/microfones' },
    image: '/demo/banners/hero-estudio.svg',
  },
  {
    eyebrow: 'Baterias e Percussão',
    title: (
      <>
        Sinta o groove em <em>cada batida.</em>
      </>
    ),
    text: 'Kits completos, peças avulsas e acessórios para bateristas de todos os níveis.',
    cta: { label: 'Ver baterias', to: '/categoria/baterias-e-percussao' },
    secondary: { label: 'Ofertas', to: '/ofertas' },
    image: '/demo/banners/hero-bateria.svg',
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setIndex((i + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      className={s.hero}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((sl, i) => (
        <div
          key={i}
          className={`${s.slide} ${i === index ? s.slideActive : ''}`}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} de ${SLIDES.length}`}
        >
          <img src={imgUrl(sl.image)} alt="" className={s.slideImg} fetchPriority={i === 0 ? 'high' : 'low'} />
          <div className={`container ${s.slideContent}`}>
            <span className="eyebrow">{sl.eyebrow}</span>
            <h1 className={s.heroTitle}>{sl.title}</h1>
            <p className={s.heroText}>{sl.text}</p>
            <div className={s.heroCtas}>
              <Link to={sl.cta.to} className={s.heroBtn} tabIndex={i === index ? 0 : -1}>
                {sl.cta.label} <ArrowRight size={18} />
              </Link>
              <Link to={sl.secondary.to} className={s.heroBtnGhost} tabIndex={i === index ? 0 : -1}>
                {sl.secondary.label}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className={`container ${s.heroControls}`}>
        <div className={s.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${s.dot} ${i === index ? s.dotActive : ''}`}
              onClick={() => go(i)}
              aria-label={`Ir para o destaque ${i + 1}`}
              aria-current={i === index}
            >
              {i === index && !paused && <span className={s.dotProgress} />}
            </button>
          ))}
        </div>
        <div className={s.heroArrows}>
          <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Retomar' : 'Pausar'}>
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button onClick={() => go(index - 1)} aria-label="Destaque anterior">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(index + 1)} aria-label="Próximo destaque">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
