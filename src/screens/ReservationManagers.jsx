import React from 'react';
import { Card, DataTable, Badge, Button, IconButton, RefreshButton, Input, Modal, Alert, Avatar, Spinner, ListCard, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { formatNotificationDate } from '../lib/notificationLabels.js';
import s from './screens.module.css';
import t from './ReservationManagers.module.css';

// Ejemplo del SMS de las 20:00, tal como lo arma el backend (lang/es/reservations.php →
// `summary`): sin tildes, con la decoración en mayúsculas y el nombre de la compañía delante.
const SAMPLE_SMS = `Cabanas El Roble: Manana lun 15/09 llegan 2 reservas:
1) Cabana 2 - Pepito Perez (2 pers) 15:00 DECORACION: Decoracion romantica. Servicios: Cena, Fogata.
2) Cabana 5 - Maria Ruiz (4 pers) SIN CONFIRMAR`;

// Encargados de reservas de la compañía activa: los empleados que reciben cada noche, por SMS, el
// resumen de las reservas que llegan mañana con la decoración y los servicios que hay que preparar.
// Se eligen de la lista de empleados de la compañía; el backend rechaza a un cliente (huésped o
// socio). Es configuración de la compañía —gateada con `reservation-managers-config`—, no la
// operación diaria de reservas.
export function ReservationManagers() {
  const { toast } = useToast();
  const fetcher = React.useCallback(() => api.reservationManagers(), []);
  const { data, setData, loading, error, reload } = useResource(fetcher, [], []);
  const managers = data || [];

  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState(null); // encargado a retirar
  const [saving, setSaving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState(null);

  const remove = async () => {
    setSaving(true);
    setRemoveError(null);
    try {
      setData(await api.removeReservationManager(removing.user_id));
      setRemoving(null);
      toast({ tone: 'neutral', title: 'Encargado retirado' });
    } catch (e) {
      setRemoveError(e?.message || 'No se pudo retirar al encargado.');
    } finally { setSaving(false); }
  };

  const withoutPhone = managers.filter((m) => !m.has_phone);

  const columns = [
    { key: 'name', header: 'Encargado', ellipsis: true, render: (r) => (
      <span className={s.user}><Avatar name={r.name} size="sm" />{r.name}</span>
    ) },
    { key: 'phone', header: 'Celular', width: 190, nowrap: true, render: (r) => (r.has_phone
      ? <span className={s.muted}>+{r.phone_code} {r.phone_number}</span>
      : <Badge variant="warning">Sin celular</Badge>) },
    { key: 'added_at', header: 'Desde', width: 240, ellipsis: true, render: (r) => (
      <span className={s.muted}>{formatNotificationDate(r.added_at)}{r.created_by_name ? ` · ${r.created_by_name}` : ''}</span>
    ) },
    { key: 'acc', header: '', width: 60, align: 'right', render: (r) => (
      <IconButton icon="fas fa-user-minus" variant="danger" title="Retirar" size="sm" onClick={() => setRemoving(r)} />
    ) },
  ];

  return (
    <div className={s.page}>
      <Card>
        <Card.Header title="Resumen nocturno de reservas"
          action={<>
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="primary" size="sm" icon="fas fa-user-plus" onClick={() => setAdding(true)}>Agregar encargado</Button>
          </>} />
        <Card.Body>
          <div className={s.formCol}>
            <p className={t.intro}>
              Todos los días a las <strong>8:00 p. m.</strong> las personas de esta lista reciben un
              mensaje de texto con las reservas que llegan <strong>mañana</strong>: quién llega a qué
              unidad, a qué hora y con cuántas personas, y si hay que preparar una <strong>decoración</strong>
              {' '}o algún <strong>servicio adicional</strong>. Si mañana no llega nadie, no se envía nada.
            </p>
            <pre className={t.sample}>{SAMPLE_SMS}</pre>
          </div>
        </Card.Body>
      </Card>

      {!loading && !error && managers.length === 0 && (
        <Alert tone="warning" title="Nadie recibe el resumen">
          Sin encargados, el resumen de mañana no le llega a nadie: agrega al menos una persona.
        </Alert>
      )}
      {withoutPhone.length > 0 && (
        <Alert tone="warning" title="Encargados sin celular">
          {withoutPhone.map((m) => m.name).join(', ')}: el mensaje es un SMS y no hay a dónde
          enviarlo. Registra el celular en <em>Usuarios</em>.
        </Alert>
      )}

      <div className={s.desktopList}>
        <Card>
          <DataTable columns={columns} rows={managers} rowKey="user_id" loading={loading} error={error}
            empty="Aún no hay encargados de reservas." />
        </Card>
      </div>

      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><Alert tone="danger" title="No se pudieron cargar los encargados">{error}</Alert></Card>
        )}
        {!loading && !error && managers.length === 0 && (
          <Card><div className={s.mobileState}>Aún no hay encargados de reservas.</div></Card>
        )}
        {!loading && !error && managers.map((m) => (
          <ListCard key={m.user_id}
            media={<Avatar name={m.name} size="sm" />}
            title={m.name}
            subtitle={m.has_phone ? `+${m.phone_code} ${m.phone_number}` : 'Sin celular registrado'}
            badge={m.has_phone ? <Badge variant="success">Recibe el SMS</Badge> : <Badge variant="warning">Sin celular</Badge>}
            action={<Button size="sm" variant="secondary" icon="fas fa-user-minus" onClick={() => setRemoving(m)}>Retirar</Button>}
          />
        ))}
      </div>

      {adding && (
        <AddManagerModal
          managers={managers}
          onClose={() => setAdding(false)}
          onAdded={(list, name) => { setData(list); toast({ tone: 'success', title: `${name} ahora recibe el resumen` }); }}
        />
      )}

      <Modal open={!!removing} size="sm" title="Retirar encargado"
        onClose={() => { setRemoveError(null); setRemoving(null); }}
        footer={<>
          <Button variant="secondary" onClick={() => { setRemoveError(null); setRemoving(null); }}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-user-minus" loading={saving} onClick={remove}>Retirar</Button>
        </>}>
        <strong>{removing?.name}</strong> dejará de recibir el resumen nocturno de reservas. El usuario
        no se elimina ni pierde su acceso.
        {removeError && <Alert tone="danger" onClose={() => setRemoveError(null)}>{removeError}</Alert>}
      </Modal>
    </div>
  );
}

// Elegir al encargado de la lista de empleados de la compañía. Se busca por nombre o celular y
// se agrega con un toque; los que ya son encargados aparecen marcados en vez de repetirse.
function AddManagerModal({ managers, onClose, onAdded }) {
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [addingId, setAddingId] = React.useState(null);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    const id = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const fetcher = React.useCallback(() => api.reservationManagerCandidates(search), [search]);
  const { data, loading, error } = useResource(fetcher, [], [search]);
  const managerIds = new Set(managers.map((m) => m.user_id));
  const candidates = (data || []).map((c) => ({ ...c, is_manager: c.is_manager || managerIds.has(c.user_id) }));

  const add = async (candidate) => {
    if (addingId) return;
    setAddingId(candidate.user_id);
    setErr(null);
    try {
      const list = await api.addReservationManager(candidate.user_id);
      onAdded(list, candidate.name);
      onClose();
    } catch (e) {
      // 422 (no es empleado) y 409 (ya es encargado) traen su propio mensaje del backend.
      setErr(e?.message || 'No se pudo agregar al encargado.');
    } finally { setAddingId(null); }
  };

  return (
    <Modal open title="Agregar encargado" subtitle="Elige a un empleado de la compañía" onClose={onClose}
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      <div className={s.formCol}>
        <Input icon="fas fa-magnifying-glass" placeholder="Buscar por nombre o celular" value={q}
          onChange={(e) => setQ(e.target.value)} autoFocus />

        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}

        {loading && <div className={t.candidateState}><Spinner size="sm" label="Buscando…" /></div>}
        {!loading && error && <Alert tone="danger" title="No se pudieron cargar los empleados">{error}</Alert>}
        {!loading && !error && candidates.length === 0 && (
          <div className={t.candidateState}>
            {search ? 'Ningún empleado coincide con la búsqueda.' : 'La compañía no tiene empleados registrados.'}
          </div>
        )}
        {!loading && !error && candidates.length > 0 && (
          <ul className={t.candidates}>
            {candidates.map((c) => (
              <li key={c.user_id} className={t.candidate}>
                <Avatar name={c.name} size="sm" />
                <div className={t.candidateInfo}>
                  <span className={t.candidateName}>{c.name}</span>
                  <span className={t.candidatePhone}>{c.has_phone ? `+${c.phone_code} ${c.phone_number}` : 'Sin celular registrado'}</span>
                </div>
                {c.is_manager
                  ? <Badge variant="neutral">Ya es encargado</Badge>
                  : (
                    <Button size="sm" variant="outline-primary" icon="fas fa-plus"
                      loading={addingId === c.user_id} disabled={!!addingId && addingId !== c.user_id}
                      onClick={() => add(c)}>Agregar</Button>
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
