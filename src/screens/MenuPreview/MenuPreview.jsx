import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Select, Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { auth } from '../../lib/auth/index.js';
import { useResource } from '../../lib/useResource.js';
import { LAYOUTS, DEFAULT_LAYOUT } from './layouts/index.js';
import { CATEGORY_FRAMES, DEFAULT_FRAME } from './frames/index.js';
import { ACCENT_PALETTES, BACKGROUNDS, DEFAULT_ACCENT, DEFAULT_BACKGROUND, buildTheme } from './palettes.js';
import s from './MenuPreview.module.css';

// Vista "Generar menú": carta del menú a pantalla completa (sin sidebar/topbar), pensada para
// ver, compartir e imprimir/exportar a PDF. Una sola llamada (`menuContent`) trae el menú y sus
// productos ya agrupados por categoría, con descripción e imagen resuelta. El render visual lo
// delega al diseño elegido (registry en ./layouts). Conserva el guard de permisos desde App.jsx.
export function MenuPreview() {
  const { menuId } = useParams();
  const navigate = useNavigate();

  const contentRes = useResource(React.useCallback(() => api.menuContent(menuId), [menuId]), null, [menuId]);

  const [layout, setLayout] = React.useState(DEFAULT_LAYOUT);
  const [accent, setAccent] = React.useState(DEFAULT_ACCENT);
  const [background, setBackground] = React.useState(DEFAULT_BACKGROUND);
  const [framesByCat, setFramesByCat] = React.useState({}); // { [categoryId]: frameKey }

  const theme = React.useMemo(() => buildTheme(accent, background), [accent, background]);

  const company = React.useMemo(() => auth.getCompany(), []);

  // Hidrata los selectores con la configuración guardada en el menú (una sola vez, al cargar).
  // Valida cada clave contra las opciones disponibles para tolerar valores obsoletos.
  const hydratedRef = React.useRef(false);
  const savedRef = React.useRef(null);
  React.useEffect(() => {
    if (hydratedRef.current || !contentRes.data) return;
    hydratedRef.current = true;
    const cfg = contentRes.data.menu?.config || {};
    const design = LAYOUTS[cfg.design] ? cfg.design : DEFAULT_LAYOUT;
    const acc = ACCENT_PALETTES.some((p) => p.key === cfg.accent) ? cfg.accent : DEFAULT_ACCENT;
    const bg = BACKGROUNDS.some((b) => b.key === cfg.background) ? cfg.background : DEFAULT_BACKGROUND;
    setLayout(design);
    setAccent(acc);
    setBackground(bg);
    savedRef.current = JSON.stringify({ design, accent: acc, background: bg });

    // Frame (plantilla) por categoría, desde el config de cada una.
    const map = {};
    (contentRes.data.categories || []).forEach((c) => {
      const tpl = c.config?.template;
      map[c.id] = CATEGORY_FRAMES[tpl] ? tpl : DEFAULT_FRAME;
    });
    setFramesByCat(map);
  }, [contentRes.data]);

  // Cambia la plantilla de una categoría y la persiste (selección discreta → guardado inmediato).
  const onFrameChange = React.useCallback((categoryId, frame) => {
    setFramesByCat((prev) => ({ ...prev, [categoryId]: frame }));
    api.saveCategoryConfig(menuId, categoryId, { template: frame }).catch(() => {});
  }, [menuId]);

  // Persiste la selección en el menú al cambiar (debounce); solo si difiere de lo último guardado.
  React.useEffect(() => {
    if (!hydratedRef.current) return;
    const config = { design: layout, accent, background };
    const serialized = JSON.stringify(config);
    if (serialized === savedRef.current) return;
    const id = setTimeout(() => {
      savedRef.current = serialized;
      api.saveMenuConfig(menuId, config).catch(() => {});
    }, 600);
    return () => clearTimeout(id);
  }, [layout, accent, background, menuId]);

  // El backend ya entrega las categorías ordenadas y con sus ítems; solo las descartamos vacías
  // y las mapeamos a la forma que esperan los diseños ({ cat, items }).
  const groups = React.useMemo(() => {
    const categories = contentRes.data?.categories || [];
    return categories
      .filter((c) => (c.items || []).length > 0)
      .map((c) => ({ cat: { id: c.id, name: c.name }, items: c.items }));
  }, [contentRes.data]);

  const menu = contentRes.data?.menu || null;
  const loading = contentRes.loading;
  const error = contentRes.error;
  const Layout = (LAYOUTS[layout] || LAYOUTS[DEFAULT_LAYOUT]).Component;

  return (
    <div className={s.screen}>
      {/* Barra de acciones — se oculta al imprimir */}
      <div className={s.toolbar}>
        <Button variant="secondary" size="sm" icon="fas fa-arrow-left" onClick={() => navigate('/menus')}>
          Volver
        </Button>
        <div className={s.toolbarRight}>
          <Select
            icon="fas fa-table-cells-large"
            wrapClassName={s.controlSelect}
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            options={Object.entries(LAYOUTS).map(([value, l]) => ({ value, label: l.label }))}
          />
          <Select
            icon="fas fa-palette"
            wrapClassName={s.controlSelect}
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            options={ACCENT_PALETTES.map((p) => ({ value: p.key, label: p.label }))}
          />
          <Select
            icon="fas fa-fill-drip"
            wrapClassName={s.controlSelect}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            options={BACKGROUNDS.map((b) => ({ value: b.key, label: b.label }))}
          />
          <Button variant="primary" size="sm" icon="fas fa-print" onClick={() => window.print()}>
            Imprimir / PDF
          </Button>
        </div>
      </div>

      <div className={s.canvas}>
        {loading ? (
          <Spinner center label="Generando carta…" />
        ) : error ? (
          <div className={s.state}><i className="fas fa-triangle-exclamation" /> {error}</div>
        ) : groups.length === 0 ? (
          <div className={s.state}>
            <i className="fas fa-utensils" /> Este menú aún no tiene productos para mostrar.
          </div>
        ) : (
          <Layout menu={menu} company={company} groups={groups} theme={theme}
            framesByCat={framesByCat} onFrameChange={onFrameChange} />
        )}
      </div>
    </div>
  );
}
