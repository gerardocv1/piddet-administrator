import React from 'react';
import { Spinner, Card, SortableList } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './MenuAdmin.module.css';
import c from './ProductCategories.module.css';

// Categorías de producto — lado COMPAÑÍA (modo solo-ordenar).
//
// El catálogo de categorías es GLOBAL ("elite") y se administra desde Plataforma → Categorías
// globales. Aquí la compañía solo ve las categorías que USA (tiene productos) y las reordena.
// Ese orden se guarda por compañía (item_category_companies) y es el que ve el POS. El orden es
// general (una sola lista), independiente del tipo de ítem.
export function ProductCategories() {
  const fetcher = React.useCallback(() => api.categoryOrdering(), []);
  const { data, loading, error, setData } = useResource(fetcher, [], []);

  const cats = React.useMemo(
    () => [...(data || [])].sort((a, b) => a.position - b.position),
    [data],
  );

  // Reorden general: optimista local + un sort en lote (posiciones por compañía).
  const onReorder = (next) => {
    const reordered = next.map((cat, i) => ({ ...cat, position: i }));
    setData(reordered);
    api.sortItemCategories(reordered.map((cat, i) => ({ id: cat.id, position: i })));
  };

  return (
    <div className={s.page}>
      <p className={c.introWide}>
        Estas son las categorías que usas en tus productos. Arrastra para ordenarlas: ese orden es
        el que verán tus clientes en el punto de venta. Las categorías son comunes a la plataforma,
        por eso no se crean ni editan desde aquí.
      </p>

      {loading ? (
        <Spinner center label="Cargando categorías…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : cats.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-tags" />
          Aún no usas ninguna categoría. Asígnale una categoría a tus productos y aparecerá aquí.
        </div>
      ) : (
        <Card padding="0">
          <div className={c.groupBody}>
            <SortableList items={cats} onReorder={onReorder}
              renderItem={(cat, { handleProps }) => (
                <div className={t.rowInner}>
                  <button {...handleProps}><i className="fas fa-grip-vertical" /></button>
                  <div className={t.info}>
                    <div className={t.name}>{cat.name}</div>
                    {cat.type_name && <div className={t.desc}>{cat.type_name}</div>}
                  </div>
                </div>
              )} />
          </div>
        </Card>
      )}
    </div>
  );
}
