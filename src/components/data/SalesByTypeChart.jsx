import React from 'react';
import { Spinner } from '../core/Spinner.jsx';
import styles from './SalesByTypeChart.module.css';

const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('es-CO');

/** Gráfico de barras (CSS) de ventas por día, apilando productos y servicios.
 *  Sin librerías externas: alturas relativas al máximo total de la serie.
 *  `daily`: [{ date, label, products, services, total }]. */
export function SalesByTypeChart({ daily = [], loading = false }) {
  if (loading) {
    return (
      <div className={styles.wrap}>
        <Spinner center label="Cargando ventas…" />
      </div>
    );
  }

  if (!daily.length) {
    return <div className={styles.empty}>No hay ventas en el período seleccionado.</div>;
  }

  const max = Math.max(...daily.map((d) => d.total), 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.legendItem}><i className={styles.swatchProducts} /> Productos</span>
        <span className={styles.legendItem}><i className={styles.swatchServices} /> Servicios</span>
      </div>

      <div className={styles.scroller}>
        <div className={styles.chart}>
          {daily.map((d) => (
            <div key={d.date} className={styles.col} title={`${d.label}\nProductos: ${money(d.products)}\nServicios: ${money(d.services)}\nTotal: ${money(d.total)}`}>
              <div className={styles.barTrack}>
                <div className={styles.bar}>
                  <div className={styles.segProducts} style={{ height: `${(d.products / max) * 100}%` }} />
                  <div className={styles.segServices} style={{ height: `${(d.services / max) * 100}%` }} />
                </div>
              </div>
              <div className={styles.tick}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
