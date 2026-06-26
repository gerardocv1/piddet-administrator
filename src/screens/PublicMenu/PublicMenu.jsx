import React from 'react';
import { Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { LAYOUTS, DEFAULT_LAYOUT } from '../MenuPreview/layouts/index.js';
import { CATEGORY_FRAMES, DEFAULT_FRAME } from '../MenuPreview/frames/index.js';
import { ACCENT_PALETTES, BACKGROUNDS, DEFAULT_ACCENT, DEFAULT_BACKGROUND, buildTheme } from '../MenuPreview/palettes.js';
import {
  TEXT_SCALES, CATEGORY_SPACINGS, DEFAULT_SCALE, DEFAULT_SPACING, normalizeShow, buildLayoutVars,
} from '../MenuPreview/options.js';
import s from '../MenuPreview/MenuPreview.module.css';
import { shareImage, applyMetaTags, buildShareMeta, shareOrCopy } from '../public/shareMeta.js';
import { PublicBottomBar } from '../public/PublicBottomBar.jsx';

// Vista pública de la carta (sin sesión): se accede por la URL /{compañía}/m/{menú} y se renderiza
// con el diseño ya guardado en el menú. Reusa los mismos diseños/paletas/opciones que el preview
// del admin, pero en SOLO LECTURA: sin selectores de presentación ni guardado, solo imprimir/PDF.
// Recibe los identificadores por props porque se monta fuera del router del admin (ver App.jsx).
export function PublicMenu({ companyUsername, menuUsername }) {
  const res = useResource(
    React.useCallback(() => api.publicMenuContent(companyUsername, menuUsername), [companyUsername, menuUsername]),
    null,
    [companyUsername, menuUsername],
  );

  const data = res.data;
  const cfg = data?.menu?.config || {};

  // Validamos cada ajuste guardado contra las opciones disponibles para tolerar valores obsoletos.
  const layout = LAYOUTS[cfg.design] ? cfg.design : DEFAULT_LAYOUT;
  const accent = ACCENT_PALETTES.some((p) => p.key === cfg.accent) ? cfg.accent : DEFAULT_ACCENT;
  const background = BACKGROUNDS.some((b) => b.key === cfg.background) ? cfg.background : DEFAULT_BACKGROUND;
  const scale = TEXT_SCALES.some((x) => x.key === cfg.scale) ? cfg.scale : DEFAULT_SCALE;
  const spacing = CATEGORY_SPACINGS.some((x) => x.key === cfg.spacing) ? cfg.spacing : DEFAULT_SPACING;
  const show = normalizeShow(cfg.show);

  const theme = React.useMemo(
    () => ({ ...buildTheme(accent, background), ...buildLayoutVars(scale, spacing) }),
    [accent, background, scale, spacing],
  );

  // Propaga el fondo de la carta a :root para que la impresión lo pinte a sangre en cada hoja.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--carta-print-bg', theme['--carta-bg'] || '#ffffff');
    return () => root.style.removeProperty('--carta-print-bg');
  }, [theme]);

  const framesByCat = React.useMemo(() => {
    const map = {};
    (data?.categories || []).forEach((c) => {
      const tpl = c.config?.template;
      map[c.id] = CATEGORY_FRAMES[tpl] ? tpl : DEFAULT_FRAME;
    });
    return map;
  }, [data]);

  const groups = React.useMemo(() => {
    const categories = data?.categories || [];
    return categories
      .filter((c) => (c.items || []).length > 0)
      .map((c) => ({ cat: { id: c.id, name: c.name }, items: c.items }));
  }, [data]);

  const menu = data?.menu || null;
  const company = data?.company || null;
  const Layout = (LAYOUTS[layout] || LAYOUTS[DEFAULT_LAYOUT]).Component;

  const shareInfo = React.useMemo(() => {
    const name = menu?.name ? `${company?.name ? `${company.name} - ` : ''}${menu.name}` : (company?.name || 'Menú');
    const description = menu?.description || (company?.name ? `Conoce el menú de ${company.name}.` : 'Mira nuestro menú.');
    return { title: name, description, image: shareImage(company), url: typeof window !== 'undefined' ? window.location.href : '' };
  }, [menu, company]);

  // Título de pestaña + Open Graph/Twitter para apps que sí renderizan el enlace por JS.
  React.useEffect(() => {
    if (!data) return undefined;
    const prevTitle = document.title;
    document.title = shareInfo.title;
    const created = applyMetaTags(buildShareMeta(shareInfo));
    return () => { document.title = prevTitle; created.forEach((el) => el.remove()); };
  }, [data, shareInfo]);

  const [shareMsg, setShareMsg] = React.useState('');
  const share = React.useCallback(async () => {
    try {
      if (await shareOrCopy(shareInfo)) {
        setShareMsg('Enlace copiado');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch { /* sin portapapeles */ }
  }, [shareInfo]);

  return (
    <div className={`${s.screen} ${s.publicScreen}`}>
      <div className={s.canvas}>
        {res.loading ? (
          <Spinner center label="Cargando carta…" />
        ) : res.error ? (
          <div className={s.state}><i className="fas fa-triangle-exclamation" /> No pudimos cargar este menú.</div>
        ) : groups.length === 0 ? (
          <div className={s.state}><i className="fas fa-utensils" /> Este menú aún no tiene productos para mostrar.</div>
        ) : (
          // Sin `onFrameChange`: respeta el frame guardado de cada sección pero NO muestra los
          // selectores de plantilla (es configuración del admin, no del comensal).
          <Layout menu={menu} company={company} groups={groups} theme={theme} show={show}
            framesByCat={framesByCat} />
        )}
      </div>

      {/* Barra inferior tipo app: vuelve a la portada de la compañía y comparte la carta. La misma
          que usa la portada, para una línea gráfica común. Se oculta al imprimir. */}
      <PublicBottomBar items={[
        { key: 'back', icon: 'fas fa-arrow-left', label: 'Volver', href: `/${encodeURIComponent(companyUsername)}` },
        { key: 'share', icon: 'fas fa-share-nodes', label: shareMsg || 'Compartir', primary: true, onClick: share },
      ]} />
    </div>
  );
}
