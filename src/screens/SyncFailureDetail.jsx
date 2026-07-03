import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, IconButton, Spinner, Modal, Textarea } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { supportStatusOf, formatDateTime } from '../lib/syncFailureLabels.js';
import { originLabel } from '../lib/orderLabels.js';
import s from './screens.module.css';
import t from './SyncFailureDetail.module.css';

// Formatea el payload guardado para el editor; si no es JSON válido se muestra tal cual
// (el caso "payload corrupto" es justamente el que soporte necesita ver y corregir).
function prettyPayload(raw) {
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw || ''; }
}

// Detalle de un fallo de sincronización: diagnóstico, editor del JSON de la orden, reintento
// de creación y administración del estado de soporte. `resolved` es terminal (todo se bloquea).
export function SyncFailureDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const fetcher = React.useCallback(() => api.getSyncFailureReport(reportId), [reportId]);
  const { data: report, setData: setReport, loading, error } = useResource(fetcher, null, [reportId]);

  const [jsonText, setJsonText] = React.useState('');
  const [jsonDirty, setJsonDirty] = React.useState(false);
  const [jsonError, setJsonError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState(null); // { ok, text }
  const [retrying, setRetrying] = React.useState(false);
  const [retryResult, setRetryResult] = React.useState(null); // { ok, message, errors, order }
  const [modal, setModal] = React.useState(null); // 'retry' | 'unrecoverable' | 'resolve' | null
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (report) { setJsonText(prettyPayload(report.order_payload)); setJsonDirty(false); setJsonError(''); }
  }, [report?.id]);

  const goBack = () => navigate(`/sync-failures${params.toString() ? `?${params.toString()}` : ''}`);

  if (loading) return <Spinner center label="Cargando reporte…" />;
  if (error || !report) {
    return (
      <div className={s.page}>
        <div className={s.stateError}>
          <i className="fas fa-triangle-exclamation" /> {error || 'No se encontró el reporte.'}
        </div>
      </div>
    );
  }

  const st = supportStatusOf(report.support_status);
  const isResolved = report.support_status === 'resolved';
  const isUnrecoverable = report.support_status === 'unrecoverable';
  const busy = saving || retrying;

  const applyReport = (next) => { if (next) setReport(next); };

  const savePayload = async () => {
    try { JSON.parse(jsonText); } catch (e) { setJsonError(`JSON inválido: ${e.message}`); return; }
    setJsonError('');
    setSaving(true);
    setNotice(null);
    try {
      const updated = await api.updateSyncFailureReportPayload(report.id, jsonText);
      applyReport(updated);
      setJsonDirty(false);
      setNotice({ ok: true, text: 'Payload guardado.' });
    } catch (e) {
      setNotice({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const retry = async () => {
    setModal(null);
    setRetrying(true);
    setNotice(null);
    setRetryResult(null);
    try {
      const res = await api.retrySyncFailureReport(report.id);
      applyReport(res?.report);
      setRetryResult({ ok: true, message: 'Orden creada correctamente.', order: res?.order || null });
    } catch (e) {
      // El backend devuelve el reporte actualizado (attempts, last_retry_error) junto al fallo.
      applyReport(e.data?.report);
      setRetryResult({ ok: false, message: e.message, errors: e.errors || null });
    } finally {
      setRetrying(false);
    }
  };

  const changeStatus = async (support_status) => {
    setModal(null);
    setSaving(true);
    setNotice(null);
    try {
      const updated = await api.updateSyncFailureReportStatus(report.id, {
        support_status,
        resolution_notes: notes.trim() || null,
      });
      applyReport(updated);
      setNotice({ ok: true, text: 'Estado actualizado.' });
    } catch (e) {
      setNotice({ ok: false, text: e.message });
    } finally {
      setSaving(false);
      setNotes('');
    }
  };

  const diagnosis = [
    ['Reportó', report.reported_username || '—'],
    ['Origen', originLabel(report.reported_origin)],
    ['Intentos', report.attempts],
    ['Estado de pago', report.paid_sync_status || '—'],
    ['Orden (uuid)', report.order_uuid || '—'],
    ['Reportado', formatDateTime(report.created_at)],
  ];

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a fallos de órdenes" onClick={goBack} />
        <div className={t.headText}>
          <h2 className={t.title}>Reporte {report.order_number || report.id}</h2>
          <span className={s.muted}>{formatDateTime(report.created_at)}</span>
        </div>
        <Badge variant={st.variant} dot>{st.label}</Badge>
      </div>

      <Card>
        <Card.Header title="Diagnóstico" />
        <Card.Body>
          <p className={t.errorMessage}><i className="fas fa-circle-exclamation" /> {report.error_message || 'Sin mensaje de error.'}</p>
          <dl className={t.meta}>
            {diagnosis.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          {report.last_retry_error && (
            <p className={t.lastRetry}>
              Último reintento {report.last_retry_at ? `(${formatDateTime(report.last_retry_at)})` : ''}: {report.last_retry_error}
            </p>
          )}
          {report.recovered_order_uuid && (
            <p className={t.recovered}>
              <i className="fas fa-circle-check" /> Orden recuperada: <strong>{report.recovered_order_uuid}</strong>
            </p>
          )}
          {(report.resolution_notes || report.resolved_username) && (
            <p className={t.resolution}>
              {report.resolved_username && <span>Gestionado por <strong>{report.resolved_username}</strong>{report.resolved_at ? ` el ${formatDateTime(report.resolved_at)}` : ''}. </span>}
              {report.resolution_notes}
            </p>
          )}
          {report.context && (
            <details className={t.context}>
              <summary>Contexto del reporte</summary>
              <pre>{report.context}</pre>
            </details>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="JSON de la orden" />
        <Card.Body>
          <p className={s.muted}>{isResolved ? 'Reporte resuelto: solo lectura.' : 'Corrige el payload y guárdalo antes de reintentar.'}</p>
          <textarea
            className={t.jsonArea}
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setJsonDirty(true); setJsonError(''); }}
            spellCheck={false}
            rows={18}
            disabled={isResolved || busy}
          />
          {jsonError && <p className={t.jsonError}><i className="fas fa-triangle-exclamation" /> {jsonError}</p>}
          {notice && (
            <p className={notice.ok ? t.noticeOk : t.noticeError}>
              <i className={notice.ok ? 'fas fa-circle-check' : 'fas fa-triangle-exclamation'} /> {notice.text}
            </p>
          )}
        </Card.Body>
      </Card>

      <div className={t.actions}>
        <Button icon="fas fa-floppy-disk" variant="secondary" onClick={savePayload}
          disabled={isResolved || !jsonDirty || busy} loading={saving}>
          Guardar JSON
        </Button>
        <Button icon="fas fa-play" onClick={() => setModal('retry')} disabled={isResolved || busy} loading={retrying}>
          Reintentar orden
        </Button>
        {!isResolved && !isUnrecoverable && (
          <Button icon="fas fa-ban" variant="danger" onClick={() => setModal('unrecoverable')} disabled={busy}>
            Marcar no recuperable
          </Button>
        )}
        {isUnrecoverable && (
          <Button icon="fas fa-rotate-left" variant="secondary" onClick={() => changeStatus('pending')} disabled={busy}>
            Reabrir
          </Button>
        )}
        {!isResolved && (
          <Button icon="fas fa-check" variant="success" onClick={() => setModal('resolve')} disabled={busy}>
            Marcar resuelto
          </Button>
        )}
      </div>

      {retryResult && (
        <Card>
          <Card.Header title="Resultado del reintento" />
          <Card.Body>
            {retryResult.ok ? (
              <p className={t.noticeOk}>
                <i className="fas fa-circle-check" /> {retryResult.message}
                {retryResult.order && <> Orden <strong>{retryResult.order.order_number || retryResult.order.id}</strong>.</>}
              </p>
            ) : (
              <>
                <p className={t.noticeError}><i className="fas fa-triangle-exclamation" /> {retryResult.message}</p>
                {retryResult.errors && (
                  <ul className={t.errorList}>
                    {Object.entries(retryResult.errors).map(([field, msgs]) => (
                      <li key={field}><code>{field}</code>: {Array.isArray(msgs) ? msgs.join(' ') : String(msgs)}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {modal === 'retry' && (
        <Modal size="sm" title="Reintentar orden" onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
              <Button icon="fas fa-play" onClick={retry}>Reintentar</Button>
            </>
          }>
          <p>Se intentará crear la orden con el JSON guardado{jsonDirty ? ' (tienes cambios sin guardar que NO se enviarán)' : ''}. Si se crea, el reporte quedará resuelto.</p>
        </Modal>
      )}

      {modal === 'unrecoverable' && (
        <Modal size="sm" title="Marcar como no recuperable" onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="danger" icon="fas fa-ban" onClick={() => changeStatus('unrecoverable')}>No recuperable</Button>
            </>
          }>
          <p>La orden no se podrá recuperar desde el panel (podrás reabrir el reporte si cambia la situación).</p>
          <Textarea label="Nota (opcional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Por qué no es recuperable…" />
        </Modal>
      )}

      {modal === 'resolve' && (
        <Modal size="sm" title="Marcar como resuelto" onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="success" icon="fas fa-check" onClick={() => changeStatus('resolved')}>Resolver</Button>
            </>
          }>
          <p>Cierra el reporte sin reintentar (p. ej. la orden ya se registró por otro medio). Este estado es terminal.</p>
          <Textarea label="Nota (opcional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Cómo se solucionó…" />
        </Modal>
      )}
    </div>
  );
}
