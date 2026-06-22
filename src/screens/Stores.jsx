import React from 'react';
import { Button, IconButton, Switch, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './Stores.module.css';

export function Stores() {
  const { data: rows, setData: setRows, loading, error } = useResource(api.storesDetail, []);

  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, open: !r.open } : r));

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <p className={s.toolbarText}>Restaurantes conectados a tu cuenta de Piddet.</p>
        <div className={s.spacer} />
        <Button variant="primary" icon="fas fa-plus">Añadir tienda</Button>
      </div>

      {loading ? (
        <Spinner center label="Cargando tiendas…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : (
      <div className={t.grid}>
        {rows.map((x) => (
          <div key={x.id} className={t.card}>
            <div className={t.cardTop}>
              <div className={t.head}>
                <span className={t.icon}><i className="fas fa-store" /></span>
                <div style={{ minWidth: 0 }}>
                  <div className={t.name}>{x.name}</div>
                  <span className={[s.status, x.open ? s.on : s.off].join(' ')}>
                    <span className={s.statusDot} />{x.open ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>
              </div>
              <IconButton icon="fas fa-ellipsis-v" variant="ghost" title="Más" size="sm" />
            </div>

            <div className={t.meta}>
              <span><i className="fas fa-location-dot" />{x.dir}</span>
              <span><i className="fas fa-phone" />{x.tel}</span>
              <span><i className="fas fa-receipt" />{x.pedidos} pedidos en curso</span>
            </div>

            <div className={t.foot}>
              <Switch label="Abierta" checked={x.open} onChange={() => toggle(x.id)} />
              <a href="#" onClick={(e) => e.preventDefault()} className={t.link}>Administrar</a>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
