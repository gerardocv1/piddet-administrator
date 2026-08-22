import React from 'react';
import { ToastProvider } from '../components';
import { PrinciplesSection } from './sections/PrinciplesSection.jsx';
import { ColorSection } from './sections/ColorSection.jsx';
import { TypographySection } from './sections/TypographySection.jsx';
import { SurfaceSection } from './sections/SurfaceSection.jsx';
import { ButtonsSection } from './sections/ButtonsSection.jsx';
import { FormsSection } from './sections/FormsSection.jsx';
import { DataSection } from './sections/DataSection.jsx';
import { FeedbackSection } from './sections/FeedbackSection.jsx';
import { NavigationSection } from './sections/NavigationSection.jsx';
import styles from './Styleguide.module.css';

// Índice de la guía: id = ancla de la sección. El orden es el del documento.
const SECTIONS = [
  { id: 'principios', label: 'Principios', icon: 'fas fa-compass' },
  { id: 'color', label: 'Color', icon: 'fas fa-palette' },
  { id: 'tipografia', label: 'Tipografía', icon: 'fas fa-font' },
  { id: 'superficie', label: 'Superficie y espaciado', icon: 'fas fa-layer-group' },
  { id: 'botones', label: 'Botones', icon: 'fas fa-hand-pointer' },
  { id: 'formularios', label: 'Formularios', icon: 'fas fa-pen-to-square' },
  { id: 'datos', label: 'Datos y tablas', icon: 'fas fa-table' },
  { id: 'feedback', label: 'Feedback', icon: 'fas fa-bell' },
  { id: 'navegacion', label: 'Navegación', icon: 'fas fa-map-signs' },
];

/**
 * Guía de diseño viva del panel: monta los componentes REALES de `src/components`
 * sobre los tokens de `src/styles/tokens.css`. No toca auth ni backend; es una
 * entrada independiente de Vite (styleguide.html).
 *
 * Comparte la clave de tema con la app (`piddet_theme`) para revisar cada pieza
 * en claro y oscuro tal como se vería en el panel.
 */
export function StyleguideApp() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('piddet_theme') || 'light');
  const [active, setActive] = React.useState(SECTIONS[0].id);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('piddet_theme', theme);
  }, [theme]);

  // Resalta en el índice la sección visible (scroll-spy con IntersectionObserver).
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.wordmark}>piddet</span>
            <span className={styles.brandSub}>Guía de diseño</span>
          </div>
          <nav className={styles.nav}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className={[styles.navLink, active === s.id ? styles.navActive : ''].filter(Boolean).join(' ')}>
                <i className={s.icon} aria-hidden="true" />
                <span>{s.label}</span>
              </a>
            ))}
          </nav>
          <button type="button" className={styles.themeToggle}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} aria-hidden="true" />
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
        </aside>

        <main className={styles.content}>
          <header className={styles.hero}>
            <h1 className={styles.heroTitle}>Sistema de diseño Piddet</h1>
            <p className={styles.heroText}>
              Catálogo vivo de la línea visual del panel de administración: tokens, componentes y
              patrones tal como existen en <code>src/components</code> y <code>src/styles/tokens.css</code>.
              Lo que se ve aquí es lo que corre en producción — mejorar un componente aquí es
              mejorarlo en toda la app.
            </p>
          </header>

          <PrinciplesSection />
          <ColorSection theme={theme} />
          <TypographySection />
          <SurfaceSection />
          <ButtonsSection />
          <FormsSection />
          <DataSection />
          <FeedbackSection />
          <NavigationSection />

          <footer className={styles.footer}>
            Guía de diseño de Piddet · los componentes viven en <code>src/components</code> ·
            los tokens en <code>src/styles/tokens.css</code>
          </footer>
        </main>
      </div>
    </ToastProvider>
  );
}
