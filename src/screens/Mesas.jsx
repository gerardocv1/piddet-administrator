import React from 'react';
import { Button } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './Mesas.module.css';

const ST = {
  libre: { label: 'Libre', dot: s.dotLibre, txt: s.txtLibre },
  ocupada: { label: 'Ocupada', dot: s.dotOcupada, txt: s.txtOcupada },
  cuenta: { label: 'Por pagar', dot: s.dotCuenta, txt: s.txtCuenta },
  reservada: { label: 'Reservada', dot: s.dotReservada, txt: s.txtReservada },
};

export function Mesas() {
  const { data: mesas, setData: setMesas } = useResource(api.mesas, []);

  const cycle = (n) => {
    const order = ['libre', 'ocupada', 'cuenta'];
    setMesas((ms) => ms.map((m) => {
      if (m.n !== n) return m;
      const next = order[(order.indexOf(m.st) + 1) % order.length] || 'libre';
      return { ...m, st: next, t: next === 'libre' ? undefined : '0 min', tot: next === 'libre' ? undefined : '$0' };
    }));
  };
  const count = (st) => mesas.filter((m) => m.st === st).length;

  return (
    <div className={s.page}>
      <div className={s.legend}>
        {Object.entries(ST).map(([k, st]) => (
          <div key={k} className={s.legendItem}>
            <span className={[s.legendDot, st.dot].join(' ')} />{st.label} <strong>{count(k)}</strong>
          </div>
        ))}
        <div className={s.spacer} />
        <Button size="sm" variant="secondary" icon="fas fa-plus">Añadir mesa</Button>
      </div>

      <div className={s.grid}>
        {mesas.map((m) => {
          const st = ST[m.st] || ST.libre;
          return (
            <div key={m.n} onClick={() => cycle(m.n)} title="Clic para cambiar estado" className={s.card}>
              <div className={s.cardTop}>
                <span className={s.cardLabel}>Mesa {m.n}</span>
                <span className={[s.cardStatus, st.txt].join(' ')}>
                  <span className={[s.statusDot, st.dot].join(' ')} />{st.label}
                </span>
              </div>
              <div className={s.number}>{m.n}</div>
              <div className={s.cardFoot}>
                <span><i className="fas fa-user" />{m.cap}</span>
                {m.t ? <span><i className="far fa-clock" />{m.t}</span> : <span>—</span>}
                {m.tot && <strong>{m.tot}</strong>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
