import React from 'react';
import { Alert, Button, DataTable, Modal, useToast } from '../components';
import { api } from '../lib/api.js';
import { formatShortDate } from '../lib/dates.js';
import s from './screens.module.css';

// Mantenimiento del gimnasio, solo con el permiso `gym-periods-recalculate` (lo trae únicamente
// el super-admin): recalcula por calendario las fechas de los períodos vigentes. Arregla las
// suscripciones creadas cuando el vencimiento se sumaba en días, cuando un plan de un mes que
// arrancaba el 2 de octubre vencía el 31 de octubre en vez del 1 de noviembre.
//
// Nunca aplica a ciegas: primero pide al backend la simulación (`dry_run`) y muestra fila por
// fila lo que cambiaría; escribir es un segundo clic.
export function GymPeriodDatesFixButton({ onFixed }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline-primary" size="sm" icon="fas fa-calendar-check" onClick={() => setOpen(true)}>
        Revisar fechas
      </Button>
      {open && (
        <GymPeriodDatesFixModal
          onClose={() => setOpen(false)}
          onFixed={() => { setOpen(false); onFixed?.(); }}
        />
      )}
    </>
  );
}

function GymPeriodDatesFixModal({ onClose, onFixed }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    api.recalculateGymPeriodDates({ dryRun: true })
      .then((data) => { if (alive) setPreview(data); })
      .catch((e) => { if (alive) setError(e?.message || 'No se pudieron revisar las fechas.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const changes = preview?.changes || [];

  const apply = async () => {
    if (applying) return;
    setApplying(true);
    setError(null);
    try {
      const result = await api.recalculateGymPeriodDates({ dryRun: false });
      const total = result?.updated ?? 0;
      toast({ tone: 'success', title: `${total} período${total === 1 ? '' : 's'} corregido${total === 1 ? '' : 's'}` });
      onFixed();
    } catch (e) {
      setError(e?.message || 'No se pudieron corregir las fechas.');
      setApplying(false);
    }
  };

  const columns = [
    { key: 'member_name', header: 'Afiliado', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.member_name}</span> },
    { key: 'number', header: 'Período', width: 90, render: (r) => `#${r.number}` },
    { key: 'start_date', header: 'Inicio', width: 110, render: (r) => formatShortDate(r.start_date) },
    { key: 'old_end_date', header: 'Vence hoy', width: 120, render: (r) => <span className={s.faint}>{formatShortDate(r.old_end_date)}</span> },
    { key: 'new_end_date', header: 'Pasa a vencer', width: 130, render: (r) => <span className={s.cellStrong}>{formatShortDate(r.new_end_date)}</span> },
  ];

  return (
    <Modal open title="Revisar fechas de vencimiento" subtitle="Mantenimiento del gimnasio" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>{changes.length ? 'Cancelar' : 'Cerrar'}</Button>
        {changes.length > 0 && (
          <Button variant="primary" loading={applying} onClick={apply}>
            Corregir {changes.length} período{changes.length === 1 ? '' : 's'}
          </Button>
        )}
      </>}>
      <div className={s.formCol}>
        <p className={s.faint}>
          Los planes en meses vencen por calendario: el período que arranca el 2 de octubre vence
          el 1 de noviembre, tenga el mes 28, 30 o 31 días; y el que arranca un 31 cubre el mes
          siguiente completo (31 de agosto → 30 de septiembre). Esto corrige los períodos vigentes
          que se calcularon sumando días. No toca la historia: los períodos cerrados o cancelados
          y las suscripciones ya canceladas quedan como están.
        </p>

        {error && <Alert tone="danger" onClose={() => setError(null)}>{error}</Alert>}

        {!loading && !error && changes.length === 0 && (
          <Alert tone="success" title="No hay nada que corregir">
            Los {preview?.scanned ?? 0} períodos vigentes ya vencen por calendario.
          </Alert>
        )}

        {(loading || changes.length > 0) && (
          <DataTable
            columns={columns}
            rows={changes}
            loading={loading}
            empty="No hay períodos por corregir."
          />
        )}
      </div>
    </Modal>
  );
}
