"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import styles from '@/app/login.module.css';

const slides = [
  {
    image: '/images/login/equipo.webp',
    alt: 'Tres profesionales revisan juntos los procesos de su empresa.',
    title: 'La calidad empieza con tu equipo.',
  },
  {
    image: '/images/login/procesos.webp',
    alt: 'Dos profesionales analizan un diagrama de procesos en su oficina.',
    title: 'Cada proceso, una oportunidad de mejorar.',
  },
  {
    image: '/images/login/resultados.webp',
    alt: 'Un equipo comparte y evalúa los resultados de su trabajo.',
    title: 'Juntos, convertimos la calidad en resultados.',
  },
];

export function LoginCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState<boolean[]>(slides.map(() => false));

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      preference.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || !visible || !loaded[active]) return;
    const timer = window.setInterval(() => {
      setActive(current => {
        const next = (current + 1) % slides.length;
        return loaded[next] ? next : current;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, visible, loaded, active]);

  const selectSlide = (index: number) => {
    setPaused(true);
    setActive((index + slides.length) % slides.length);
  };
  const playing = !paused && !reducedMotion;
  const controlClass = styles.carouselButton;

  return (
    <section
      className={styles.hero}
      aria-label="La calidad en equipo"
      aria-roledescription="carrusel"
      onFocusCapture={event => {
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) setPaused(true);
      }}
    >
      <div className={styles.slides} aria-live={playing ? 'off' : 'polite'}>
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`${styles.slide} ${active === index ? styles.activeSlide : ''}`}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${slides.length}`}
            aria-hidden={active !== index}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              unoptimized
              loading="eager"
              fetchPriority={index === 0 ? 'high' : 'low'}
              sizes="(max-width: 900px) 100vw, 60vw"
              className={styles.heroImage}
              onLoad={() => setLoaded(current => current[index] ? current : current.map((value, i) => i === index || value))}
            />
            <div className={styles.heroShade} />
            <p className={styles.heroTitle}>{slide.title}</p>
          </div>
        ))}
      </div>
      <div className={styles.carouselControls}>
        <div className={styles.dots} role="group" aria-label="Seleccionar imagen">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={styles.dotButton}
              aria-label={`Mostrar imagen ${index + 1}: ${slide.title}`}
              aria-pressed={active === index}
              onClick={() => selectSlide(index)}
            >
              <span className={active === index ? styles.activeDot : styles.dot} />
            </button>
          ))}
        </div>
        <div className={styles.playbackControls}>
          <button type="button" className={controlClass} aria-label="Imagen anterior" onClick={() => selectSlide(active - 1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={controlClass}
            aria-label={playing ? 'Pausar carrusel' : 'Reproducir carrusel'}
            onClick={() => {
              setReducedMotion(false);
              setPaused(playing);
            }}
          >
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
          <button type="button" className={controlClass} aria-label="Imagen siguiente" onClick={() => selectSlide(active + 1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
