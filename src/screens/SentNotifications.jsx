import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, FilterBar, Pagination, RefreshButton, Alert, Modal, Button, ConfirmDialog, Input, Textarea, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import {
  notificationStatusOf, NOTIFICATION_STATUS_OPTIONS, notificationTypeOf, NOTIFICATION_TYPE_OPTIONS,
  sourceReferenceLabel, formatNotificationDate,
} from '../lib/notificationLabels.js';
import s from './screens.module.css';
import t from './SentNotifications.module.css';

const EMPTY = { items: [], pagination: null };
const EMPTY_SUMMARY = { source_references: [] };

// Historial de notificaciones enviadas por la compañía activa: a quién salió cada mensaje, con qué
// texto, por qué motivo y en qué estado quedó. Responde "¿le llegó el SMS?" sin abrir el panel de
// la pasarela.
//
// Una notificación es el registro de algo que ya pasó: no se edita ni se borra. Lo único que se
// puede hacer es reenviarla (otra fila) o disparar un SMS de prueba a un número escrito a mano,
// que entra al historial como una más: así se comprueba la pasarela sin esperar a que el negocio
// mande algo. Los filtros y la página viven en la URL para que compartir el enlace lleve a la
// misma consulta.
export function SentNotifications() {
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || '';
  const dateTo = params.get('date_to') || '';
  const status = params.get('status') || '';
  const type = params.get('type') || '';
  const sourceReference = params.get('source_reference') || '';
  const search = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [selected, setSelected] = React.useState(null);
  const [testing, setTesting] = React.useState(false);

  const setQuery = (next, nextPage = 1) => {
    const q = { date_from: dateFrom, date_to: dateTo, status, type, source_reference: sourceReference, q: search, ...next };
    const clean = {};
    Object.entries(q).forEach(([k, v]) => { if (v) clean[k] = v; });
    if (nextPage > 1) clean.page = String(nextPage);
    setParams(clean);
  };

  // El buscador escribe en la URL con un respiro: una letra no es una consulta.
  const [searchInput, setSearchInput] = React.useState(search);
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput.trim() !== search) setQuery({ q: searchInput.trim() });
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = { dateFrom, dateTo, status, type, sourceReference, search };

  const fetcher = React.useCallback(
    () => api.getSentNotifications({ ...filters, page }),
    [dateFrom, dateTo, status, type, sourceReference, search, page] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [dateFrom, dateTo, status, type, sourceReference, search, page]);

  // Del resumen solo interesan los motivos que alimentan el filtro; no dependen de los filtros.
  const summaryFetcher = React.useCallback(() => api.getSentNotificationsSummary(), []);
  const { data: summary, reload: reloadSummary } = useResource(summaryFetcher, EMPTY_SUMMARY, []);

  const rows = data.items || [];
  const pg = data.pagination;

  const columns = [
    { key: 'date', header: 'Fecha', width: 120, render: (r) => formatNotificationDate(r.date) },
    {
      key: 'addressee', header: 'Destinatario', width: 160,
      render: (r) => <span className={s.cellStrong}>{r.addressee || <span className={s.faint}>—</span>}</span>,
    },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => { const st = notificationStatusOf(r.status); return <Badge variant={st.variant}>{st.label}</Badge>; },
    },
    { key: 'type', header: 'Canal', width: 90, render: (r) => notificationTypeOf(r.type) },
    { key: 'source_reference', header: 'Motivo', width: 180, ellipsis: true, render: (r) => sourceReferenceLabel(r.source_reference) },
    {
      // En el teléfono la tabla hace scroll horizontal (patrón de DataTable) y el texto queda
      // cortado; completo está a un toque, en el detalle de la fila.
      key: 'message', header: 'Mensaje', ellipsis: true,
      render: (r) => <span title={r.message || ''}>{r.message || <span className={s.faint}>—</span>}</span>,
    },
  ];

  // El desplegable de motivos sale de lo que la compañía ha enviado de verdad, no de un catálogo
  // inventado en el panel: si nunca mandó un recordatorio, no aparece.
  const sourceOptions = (summary.source_references || []).map((reference) => ({
    value: reference,
    label: sourceReferenceLabel(reference),
  }));

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Fechas', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to' },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-filter', options: NOTIFICATION_STATUS_OPTIONS },
    { key: 'type', type: 'select', label: 'Canal', icon: 'fas fa-comment-sms', options: NOTIFICATION_TYPE_OPTIONS },
    { key: 'source_reference', type: 'select', label: 'Motivo', icon: 'fas fa-tag', options: sourceOptions },
  ];

  const refresh = () => { reload(); reloadSummary(); };

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar por destinatario o texto"
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, status, type, source_reference: sourceReference }}
        onChange={(next) => setQuery({
          date_from: next.date_from || '',
          date_to: next.date_to || '',
          status: next.status || '',
          type: next.type || '',
          source_reference: next.source_reference || '',
        })}
        resultCount={pg?.total}
        actions={
          <>
            <Button variant="primary" icon="fas fa-paper-plane" onClick={() => setTesting(true)}>Enviar prueba</Button>
            <RefreshButton loading={loading} onClick={refresh} />
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin notificaciones' : `${pg.total} ${pg.total === 1 ? 'notificación' : 'notificaciones'}`}
              </p>
            )}
          </>
        }
      />

      {error ? (
        <Alert tone="danger" title="No se pudieron cargar las notificaciones">{error}</Alert>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            empty="No hay notificaciones con el filtro actual."
            onRowClick={(r) => setSelected(r)}
          />
        </Card>
      )}

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}

      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => setSelected(null)}
          onResent={() => { setSelected(null); refresh(); }}
        />
      )}

      {testing && (
        <TestNotificationModal
          onClose={() => setTesting(false)}
          onSent={() => { setTesting(false); refresh(); }}
        />
      )}
    </div>
  );
}

// SMS de prueba a un número escrito a mano. Sale por el mismo camino que cualquier aviso: queda
// en el historial con motivo "Envío de prueba" y se cobra como uno más. Si la pasarela lo rechaza
// en el acto, el backend responde con el motivo, que es justo lo que se vino a averiguar.
function TestNotificationModal({ onClose, onSent }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ to: '', message: '' });
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const to = form.to.replace(/[\s-]/g, '');
    const message = form.message.trim();
    if (!/^\+?[0-9]{7,15}$/.test(to)) { setErr('Escribe el celular con indicativo de país y solo dígitos, por ejemplo 573001234567.'); return; }
    if (!message) { setErr('Escribe el texto del mensaje.'); return; }

    setSending(true);
    setErr(null);
    try {
      await api.sendTestNotification({ to, message });
      toast({ tone: 'success', title: 'Prueba en camino: aparece en el historial como una notificación más' });
      onSent();
    } catch (e) {
      setErr(e?.message || 'No se pudo enviar la prueba.');
    } finally { setSending(false); }
  };

  return (
    <Modal open title="Enviar notificación de prueba" subtitle="SMS" size="md" onClose={sending ? undefined : onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={sending}>Cancelar</Button>
        <Button variant="primary" icon="fas fa-paper-plane" loading={sending} onClick={submit}>Enviar prueba</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Celular" type="tel" inputMode="numeric" placeholder="573001234567" value={form.to}
          onChange={(e) => set('to', e.target.value)} autoFocus
          hint="Con indicativo de país, sin espacios ni símbolos." />
        <Textarea label="Mensaje" rows={3} maxLength={300} value={form.message}
          onChange={(e) => set('message', e.target.value)}
          hint="Sale tal cual, encabezado por el nombre de la compañía." />
        <Alert tone="warning">
          Es un envío real: queda en el historial y se cobra como cualquier otro SMS.
        </Alert>
        {err && <Alert tone="danger" title="No salió" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// El reenvío es un envío NUEVO: otra fila en el historial, otra referencia en la pasarela; esta
// no cambia. Una fallida se reenvía sin más; una enviada o pendiente hay que FORZARLA, porque el
// mensaje se cobra otra vez (y una pendiente puede seguir en la cola).
function NotificationDetailModal({ notification, onClose, onResent }) {
  const st = notificationStatusOf(notification.status);
  const { toast } = useToast();
  const [confirming, setConfirming] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState(null);
  const failed = notification.status === 3;

  const resend = async () => {
    setSending(true);
    setSendError(null);
    try {
      await api.resendSentNotification(notification.id, { force: !failed });
      toast({ tone: 'success', title: 'Reenvío en camino: aparece como una notificación nueva en el historial' });
      setConfirming(false);
      onResent();
    } catch (e) {
      // 409 (no falló, exige forzar) y 502 (la pasarela lo rechazó) traen su mensaje del backend.
      setSendError(e?.message || 'No se pudo reenviar la notificación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Modal
        open
        title="Notificación enviada"
        subtitle={sourceReferenceLabel(notification.source_reference)}
        onClose={onClose}
        size="lg"
        footer={<>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button
            variant={failed ? 'primary' : 'danger'}
            icon={failed ? 'fas fa-paper-plane' : 'fas fa-repeat'}
            onClick={() => setConfirming(true)}
          >
            {failed ? 'Reenviar' : 'Forzar reenvío'}
          </Button>
        </>}
      >
        <div className={t.detail}>
          <div className={t.detailGrid}>
            <Field label="Estado"><Badge variant={st.variant}>{st.label}</Badge></Field>
            <Field label="Canal">{notificationTypeOf(notification.type)}</Field>
            <Field label="Destinatario">{notification.addressee || '—'}</Field>
            <Field label="Fecha">{formatNotificationDate(notification.date)}</Field>
            <Field label="Registrada">{formatNotificationDate(notification.created_at)}</Field>
            {notification.integration ? <Field label="Pasarela">{notification.integration}</Field> : null}
            {/* El acuse del proveedor: con él se rastrea este envío concreto en su panel. */}
            {notification.shipping_reference ? <Field label="Referencia de envío">{notification.shipping_reference}</Field> : null}
            {notification.read_at ? <Field label="Leída">{formatNotificationDate(notification.read_at)}</Field> : null}
            {notification.clicked_at ? <Field label="Abierta">{formatNotificationDate(notification.clicked_at)}</Field> : null}
          </div>

          <div className={t.field}>
            <span className={t.fieldLabel}>Mensaje</span>
            <p className={t.message}>{notification.message || '—'}</p>
          </div>

          {notification.deep_link && (
            <div className={t.field}>
              <span className={t.fieldLabel}>Enlace</span>
              <span className={t.fieldValue}>{notification.deep_link}</span>
            </div>
          )}

          {notification.status === 1 && (
            <Alert tone="warning" title="Todavía no ha salido">
              Quedó registrada y espera a la pasarela. Si lleva mucho así, el worker de colas no está
              corriendo en el servidor.
            </Alert>
          )}

          {notification.status === 3 && (
            <Alert tone="danger" title="No se pudo enviar">
              {notification.error
                ? <>{notification.error}. Una vez corregido, puedes reenviarla desde aquí.</>
                : <>La pasarela rechazó el mensaje sin dejar el motivo en el registro; está en el log
                  del servidor (<code>QUEUE_NOTIFICATION_INTEGRATIONS_ERROR</code>). Una vez
                  corregido, puedes reenviarla desde aquí.</>}
            </Alert>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirming}
        title={failed ? 'Reenviar la notificación' : 'Forzar el reenvío'}
        confirmLabel={failed ? 'Reenviar' : 'Forzar reenvío'}
        variant={failed ? 'primary' : 'danger'}
        icon={failed ? 'fas fa-paper-plane' : 'fas fa-repeat'}
        loading={sending}
        error={sendError}
        onConfirm={resend}
        onClose={() => { if (!sending) { setConfirming(false); setSendError(null); } }}
      >
        <p>
          Se enviará de nuevo el mismo mensaje a <strong>{notification.addressee}</strong>. Quedará
          como una notificación nueva en el historial; esta no cambia.
        </p>
        {!failed && (
          <p>
            {notification.status === 1
              ? 'Esta notificación sigue pendiente: puede que la pasarela todavía la entregue y el destinatario reciba el mensaje dos veces.'
              : 'Esta notificación ya salió: el destinatario recibirá el mensaje otra vez y el envío se cobra de nuevo.'}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div className={t.field}>
      <span className={t.fieldLabel}>{label}</span>
      <span className={t.fieldValue}>{children}</span>
    </div>
  );
}
