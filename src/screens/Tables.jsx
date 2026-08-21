import React from 'react';
import { Button, IconButton, RefreshButton, Card, Badge, Modal, Input, Textarea, Spinner, ConfirmDialog, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { auth as authLib } from '../lib/auth/index.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { tableQrDataUrl, downloadTableQrPng, printTablesQrSheet } from '../lib/tableQr.js';
import s from './screens.module.css';
import t from './Tables.module.css';

const isOccupied = (table) => table.status === 'occupied';
const isActive = (table) => table.is_active === true || table.is_active === 1;

/**
 * Mesas de la compañía activa: configuración (nombre, descripción, capacidad), estado de
 * ocupación y códigos QR para el POS.
 *
 * El estado de ocupación lo mueve normalmente el POS al asignar o liberar la mesa; desde aquí
 * se puede forzar (p. ej. una mesa que quedó ocupada por una orden mal cerrada) y liberar todas
 * de una vez al cerrar el turno.
 */
export function Tables() {
  const { data: tables, loading, error, reload } = useResource(api.tables, [], []);
  const { toast } = useToast();
  const { can } = usePermissions();
  const canCreate = can('table-create');
  const canEdit = can('table-update');
  const company = authLib.getCompany() || {};

  const [editing, setEditing] = React.useState(null); // mesa a editar, o 'new'
  const [qrTable, setQrTable] = React.useState(null);
  const [releasingAll, setReleasingAll] = React.useState(false);
  const [busyId, setBusyId] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [releaseError, setReleaseError] = React.useState(null);

  const rows = tables || [];
  const activeTables = rows.filter(isActive);
  const counters = {
    available: activeTables.filter((table) => !isOccupied(table)).length,
    occupied: activeTables.filter(isOccupied).length,
    inactive: rows.length - activeTables.length,
  };

  const run = async (table, action, done) => {
    setBusyId(table.id);
    setActionError(null);
    try {
      await action();
      reload();
      if (done) toast(done);
    } catch (e) {
      setActionError(e?.message || 'No se pudo completar la acción.');
    } finally { setBusyId(null); }
  };

  const toggleOccupation = (table) =>
    run(table, () => api.setTableStatus(table.id, isOccupied(table) ? 'available' : 'occupied'),
      { tone: 'success', title: isOccupied(table) ? 'Mesa liberada' : 'Mesa ocupada' });

  const toggleActive = (table) =>
    run(table, () => api.setTableActive(table.id, !isActive(table)),
      isActive(table)
        ? { tone: 'neutral', title: 'Mesa desactivada' }
        : { tone: 'success', title: 'Mesa activada' });

  const releaseAll = async () => {
    setReleaseError(null);
    try {
      await api.makeAllTablesAvailable();
      setReleasingAll(false);
      reload();
      toast({ tone: 'success', title: 'Mesas liberadas' });
    } catch (e) {
      setReleaseError(e?.message || 'No se pudieron liberar las mesas.');
    }
  };

  const printAll = async () => {
    setActionError(null);
    const opened = await printTablesQrSheet(company, activeTables);
    if (!opened) {
      setActionError('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.');
    }
  };

  return (
    <div className={s.page}>
      <div className={t.toolbar}>
        <div className={t.counters}>
          <span className={t.counter}><span className={[t.dot, t.dotFree].join(' ')} />Disponibles <strong>{counters.available}</strong></span>
          <span className={t.counter}><span className={[t.dot, t.dotBusy].join(' ')} />Ocupadas <strong>{counters.occupied}</strong></span>
          <span className={t.counter}><span className={[t.dot, t.dotOff].join(' ')} />Inactivas <strong>{counters.inactive}</strong></span>
        </div>
        <div className={t.actions}>
          <RefreshButton loading={loading} onClick={reload} />
          {activeTables.length > 0 && (
            <Button size="sm" variant="secondary" icon="fas fa-print" onClick={printAll}>
              Imprimir QR
            </Button>
          )}
          {canEdit && counters.occupied > 0 && (
            <Button size="sm" variant="secondary" icon="fas fa-broom" onClick={() => setReleasingAll(true)}>
              Liberar todas
            </Button>
          )}
          {canCreate && (
            <Button size="sm" variant="primary" icon="fas fa-plus" onClick={() => setEditing('new')}>
              Nueva mesa
            </Button>
          )}
        </div>
      </div>

      {actionError && <Alert tone="danger" onClose={() => setActionError(null)}>{actionError}</Alert>}

      {loading ? (
        <Spinner center label="Cargando mesas…" />
      ) : error ? (
        <Alert tone="danger" title="No se pudieron cargar las mesas">{error}</Alert>
      ) : rows.length === 0 ? (
        <Card><Card.Body><p className={t.empty}>Aún no hay mesas registradas.</p></Card.Body></Card>
      ) : (
        <div className={t.grid}>
          {rows.map((table) => (
            <article key={table.id}
              className={[t.card, isActive(table) ? '' : t.cardOff, busyId === table.id ? t.cardBusy : ''].filter(Boolean).join(' ')}>
              <header className={t.cardHead}>
                <h3 className={t.cardName}>{table.name}</h3>
                {isActive(table)
                  ? <Badge variant={isOccupied(table) ? 'warning' : 'success'} dot>{isOccupied(table) ? 'Ocupada' : 'Disponible'}</Badge>
                  : <Badge variant="neutral" dot>Inactiva</Badge>}
              </header>

              <p className={t.cardMeta}>
                <i className="fas fa-user-group" /> {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
              </p>
              {table.description && <p className={t.cardDesc}>{table.description}</p>}

              <footer className={t.cardActions}>
                <IconButton icon="fas fa-qrcode" variant="ghost" size="sm" title="Ver código QR"
                  onClick={() => setQrTable(table)} />
                {canEdit && (
                  <>
                    <IconButton icon="fas fa-pen" variant="ghost" size="sm" title="Editar mesa"
                      onClick={() => setEditing(table)} />
                    <IconButton
                      icon={isOccupied(table) ? 'fas fa-door-open' : 'fas fa-user-check'}
                      variant="ghost" size="sm"
                      title={isOccupied(table) ? 'Marcar como disponible' : 'Marcar como ocupada'}
                      disabled={!isActive(table) || busyId === table.id}
                      onClick={() => toggleOccupation(table)} />
                    <IconButton
                      icon={isActive(table) ? 'fas fa-toggle-on' : 'fas fa-toggle-off'}
                      variant="ghost" size="sm"
                      title={isActive(table) ? 'Desactivar mesa' : 'Activar mesa'}
                      disabled={busyId === table.id}
                      onClick={() => toggleActive(table)} />
                  </>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <TableFormModal
          table={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }} />
      )}

      {qrTable && <TableQrModal table={qrTable} company={company} onClose={() => setQrTable(null)} />}

      <ConfirmDialog
        open={releasingAll}
        title="Liberar todas las mesas"
        confirmLabel="Liberar todas"
        variant="primary"
        icon="fas fa-broom"
        onConfirm={releaseAll}
        onClose={() => { setReleasingAll(false); setReleaseError(null); }}>
        Las {counters.occupied} mesas ocupadas quedarán disponibles. Úsalo al cerrar el turno: no
        modifica las órdenes, solo el estado de las mesas.
        {releaseError && <Alert tone="danger" onClose={() => setReleaseError(null)}>{releaseError}</Alert>}
      </ConfirmDialog>
    </div>
  );
}

// ── Modal: crear / editar mesa ──
function TableFormModal({ table, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState(() => ({
    name: table?.name || '',
    description: table?.description || '',
    capacity: table?.capacity ?? 4,
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const name = form.name.trim();
    const capacity = Number(form.capacity);
    if (!name) { setErr('El nombre de la mesa es obligatorio.'); return; }
    if (!Number.isInteger(capacity) || capacity < 1) { setErr('La capacidad debe ser un número mayor a cero.'); return; }

    setSaving(true);
    setErr(null);
    try {
      const payload = { name, description: form.description.trim(), capacity };
      if (table) await api.updateTable(table.id, payload);
      else await api.createTable(payload);
      toast({ tone: 'success', title: table ? 'Mesa guardada' : 'Mesa creada' });
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar la mesa.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={table ? 'Editar mesa' : 'Nueva mesa'} subtitle={table?.name} size="md" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre" placeholder="Ej. Mesa 1, Barra, Terraza 3" value={form.name}
          onChange={(e) => set('name', e.target.value)} />
        <Input label="Capacidad" type="number" min="1" value={form.capacity}
          onChange={(e) => set('capacity', e.target.value)}
          hint="Número de personas que caben en la mesa." />
        <Textarea label="Descripción" rows={2} value={form.description}
          onChange={(e) => set('description', e.target.value)}
          hint="Opcional: ubicación o detalle que ayude a identificarla." />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: código QR de la mesa ──
// El QR lleva { company, table_id }: el POS lo escanea y asigna esa mesa a la orden abierta.
function TableQrModal({ table, company, onClose }) {
  const [src, setSrc] = React.useState(null);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    tableQrDataUrl(company.username, table.id, { width: 320 })
      .then((dataUrl) => { if (alive) setSrc(dataUrl); })
      .catch(() => { if (alive) setErr('No se pudo generar el código QR.'); });
    return () => { alive = false; };
  }, [company.username, table.id]);

  return (
    <Modal open title="Código QR" subtitle={table.name} size="md" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        <Button variant="primary" icon="fas fa-download" disabled={!src}
          onClick={() => downloadTableQrPng(company, table)}>
          Descargar PNG
        </Button>
      </>}>
      <div className={t.qrBox}>
        {err ? <Alert tone="danger">{err}</Alert>
          : src ? <img className={t.qrImage} src={src} alt={`Código QR de ${table.name}`} />
            : <Spinner />}
        <p className={t.qrHint}>
          Pégalo en la mesa: al escanearlo desde el POS, la orden abierta se asigna a
          <strong> {table.name}</strong>.
        </p>
      </div>
    </Modal>
  );
}
