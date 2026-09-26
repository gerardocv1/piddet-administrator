import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, DataTable, Badge, Button, FilterBar, Pagination, RefreshButton, ListCard, Avatar,
  Modal, Input, Textarea, Select, DatePicker, Alert, Spinner, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import {
  gymMoney, gymSubscriptionStatusMeta, gymPeriodStatusMeta, gymMembershipMeta, GYM_SUBSCRIPTION_STATUS, GYM_PERIOD_STATUS,
  GYM_SEX_OPTIONS, GYM_MEMBERSHIP_OPTIONS,
} from '../lib/gymLabels.js';
import { ID_TYPES } from '../lib/reservationLabels.js';
import { todayIso, yearsAgoIso } from '../lib/orderLabels.js';
import { formatShortDate, formatDayMonth, ageFromBirthdate, monthName } from '../lib/dates.js';
import s from './screens.module.css';
import gl from './GymLists.module.css';

const EMPTY = { items: [], pagination: null };

// Filtro por el estado administrativo del afiliado (el estado que se ve en la fila es el de su
// membresía, que es lo que importa en el mostrador).
const STATUS_OPTIONS = [
  { value: '1', label: 'Afiliado activo' },
  { value: '0', label: 'Afiliado inactivo' },
];

// Meses para el filtro de cumpleaños, con el nombre en mayúscula inicial.
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const name = monthName(i + 1);
  return { value: String(i + 1), label: name.charAt(0).toUpperCase() + name.slice(1) };
});

const emptyForm = {
  first_name: '', last_name: '', phone_number: '', email: '',
  id_type_id: '1', id_number: '', sex: '', birthdate: '', height_cm: '', goal_id: '', health_notes: '',
};

// Tope inferior del calendario de nacimiento: 100 años atrás cubre a cualquier afiliado y acota
// el desplegable de años a una lista manejable.
const OLDEST_BIRTHDATE = () => yearsAgoIso(100);

// Afiliados del gimnasio: personas registradas como usuarios reales de la plataforma (el backend
// las resuelve como "pasivas" al registrarlas — find-or-create por documento o celular — y las
// vincula a la compañía, mismo patrón que los huéspedes de Reservas). Por eso el alta empieza
// buscando a la persona por celular o correo: si ya tiene cuenta, se reutiliza.
// En móvil el listado son tarjetas con "Suscribir" directo (abre el formulario al llegar a la
// ficha, vía ?action=subscribe) para el afiliado que aún no tiene membresía: los períodos
// siguientes de uno ya suscrito los genera el sistema, sin acción del mostrador.
export function GymMembers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || undefined;
  // Estado de la membresía (active | grace | pending | cancelled | none): llega desde el widget
  // «Afiliados» del inicio o del filtro, con las mismas reglas que sus contadores.
  const membershipFilter = params.get('membership') || undefined;
  // Mes de cumpleaños (1-12): llega desde el widget del inicio («Ver todos») o del filtro.
  const birthdayMonth = params.get('birthday_month') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const st = 'status' in next ? next.status : status;
    const mb = 'membership' in next ? next.membership : membershipFilter;
    const bm = 'birthday_month' in next ? next.birthday_month : birthdayMonth;
    if (st) q.status = st;
    if (mb) q.membership = mb;
    if (bm) q.birthday_month = bm;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const [searchInput, setSearchInput] = React.useState(params.get('q') || '');
  const search = params.get('q') || undefined;
  React.useEffect(() => {
    const id = setTimeout(() => {
      if ((searchInput.trim() || undefined) !== search) {
        const q = {}; if (status) q.status = status; if (membershipFilter) q.membership = membershipFilter; if (birthdayMonth) q.birthday_month = birthdayMonth; if (searchInput.trim()) q.q = searchInput.trim();
        setParams(q);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetcher = React.useCallback(
    () => api.gymMembers({ status, membership: membershipFilter, search, birthdayMonth, page }),
    [status, membershipFilter, search, birthdayMonth, page],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [status, membershipFilter, search, birthdayMonth, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  // Catálogo cerrado de objetivos: el afiliado elige uno, no hay texto libre.
  const { data: goals } = useResource(api.gymGoals, [], []);
  const goalOptions = React.useMemo(
    () => [{ value: '', label: 'Sin objetivo' }, ...(goals || []).map((goal) => ({ value: String(goal.id), label: goal.label }))],
    [goals],
  );

  // Alta en dos pasos. Primero se busca a la persona por celular o correo (paso `search`): si ya
  // tiene cuenta en la plataforma se reutiliza —no se crea otro usuario— y el paso `form` solo
  // pide los datos del gimnasio; si no existe, el paso `form` pide la ficha completa.
  const [wiz, setWiz] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  const openNew = () => {
    setWiz({ step: 'search', contact: '', searching: false, account: null, affiliated: null, form: { ...emptyForm } });
    setFormError('');
  };

  const closeWizard = () => { setWiz(null); setFormError(''); };

  // Eco de la edad mientras se elige el día: confirma de un vistazo que la fecha es la correcta.
  const birthdateAge = ageFromBirthdate(wiz?.form?.birthdate);
  const birthdateHint = birthdateAge === null ? undefined : `Tiene ${birthdateAge} años.`;

  const setForm = (patch) => setWiz((w) => ({ ...w, form: { ...w.form, ...patch } }));

  // Un solo campo para no hacer elegir al mostrador: con "@" se busca por correo, si no por celular.
  const looksLikeEmail = (value) => value.includes('@');

  const searchPerson = async () => {
    const contact = (wiz?.contact || '').trim();
    if (!contact || wiz.searching) {
      if (!contact) setFormError('Escribe el celular o el correo de la persona.');
      return;
    }
    const byEmail = looksLikeEmail(contact);
    setFormError('');
    setWiz((w) => ({ ...w, searching: true, affiliated: null }));
    try {
      const found = await api.gymMemberLookup(byEmail ? { email: contact } : { phone_number: contact });
      // Ya afiliada a esta compañía: no se duplica la ficha, se ofrece abrir la que ya existe.
      if (found?.member) {
        setWiz((w) => ({ ...w, searching: false, account: found.user, affiliated: found.member }));
        return;
      }
      const account = found?.found ? found.user : null;
      setWiz((w) => ({
        ...w,
        step: 'form',
        searching: false,
        account,
        affiliated: null,
        form: {
          ...emptyForm,
          first_name: account?.first_name || '',
          last_name: account?.last_name || '',
          phone_number: account?.phone_number || (byEmail ? '' : contact),
          email: account?.email || (byEmail ? contact : ''),
          id_type_id: account?.id_type_id ? String(account.id_type_id) : '1',
          id_number: account?.id_number || '',
          birthdate: account?.birthdate || '',
        },
      }));
    } catch (e) {
      setWiz((w) => ({ ...w, searching: false }));
      setFormError(e?.message || 'No se pudo buscar a la persona.');
    }
  };

  const save = async () => {
    if (saving || !wiz) return;
    const form = wiz.form;
    // Con cuenta encontrada, los datos personales los manda su usuario: aquí solo el gimnasio.
    if (!wiz.account && (!form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim())) {
      setFormError('Completa nombres, apellidos y celular.');
      return;
    }
    if (!form.sex) {
      setFormError('Indica si es hombre o mujer: define la silueta de la vista de progreso.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const gymData = {
        sex: form.sex,
        birthdate: form.birthdate || null,
        height_cm: form.height_cm || null,
        goal_id: form.goal_id ? Number(form.goal_id) : null,
        health_notes: form.health_notes.trim() || null,
        id_type_id: form.id_type_id ? Number(form.id_type_id) : null,
        id_number: form.id_number.trim() || null,
      };
      await api.createGymMember(wiz.account
        ? { user_id: wiz.account.user_id, ...gymData }
        : {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: form.phone_number.trim(),
          email: form.email.trim() || null,
          ...gymData,
        });
      toast({ tone: 'success', title: 'Afiliado registrado' });
      closeWizard();
      reload();
    } catch (e) {
      setFormError(e?.message || 'No se pudo registrar al afiliado.');
    } finally {
      setSaving(false);
    }
  };

  // Resumen de membresía por fila: en el mostrador lo que importa es si el afiliado está al día,
  // no su activo/inactivo administrativo. Sin suscripción activa, la acción es Suscribir.
  const membership = (r) => {
    if (!r.subscription) {
      return { badge: { label: 'Sin suscripción', variant: 'neutral' }, endDate: null, detail: null, alive: false, pending: 0 };
    }
    const active = Number(r.subscription.subscription_status) === GYM_SUBSCRIPTION_STATUS.ACTIVE;
    const inGrace = active && Number(r.subscription.computed_status) === GYM_PERIOD_STATUS.GRACE;
    // El badge sigue la membresía que calcula el backend (la misma del filtro y del widget del
    // inicio): «En gracia» en cuanto debe un período que ya arrancó, el vigente o uno anterior.
    const badge = r.membership
      ? gymMembershipMeta(r.membership)
      : (inGrace ? gymPeriodStatusMeta(GYM_PERIOD_STATUS.GRACE) : gymSubscriptionStatusMeta(r.subscription.subscription_status));
    const endDate = active && r.subscription.end_date ? formatShortDate(r.subscription.end_date) : null;
    // `endDate` es la columna Vence de la tabla (escritorio). `detail` es la línea de la tarjeta
    // móvil: sin encabezado de columna, ahí la fecha se nombra; una cancelada muestra su plan.
    return {
      badge,
      endDate,
      detail: active ? (endDate && `Vence ${endDate}`) : r.subscription.plan_name,
      alive: active,
      pending: active ? Number(r.subscription.pending_total) || 0 : 0,
    };
  };

  // Estado de la membresía más, si debe algo, la etiqueta corta de pago pendiente.
  const membershipBadges = (ms) => (
    <span className={gl.badges}>
      <Badge variant={ms.badge.variant}>{ms.badge.label}</Badge>
      {ms.pending > 0 && (
        <Badge variant="danger" className={gl.badgeSmall} title={`Pendiente de pago: ${gymMoney(ms.pending)}`}>
          Pdte. pago
        </Badge>
      )}
    </span>
  );

  // Con el filtro de cumpleaños cada fila trae `birthdate`: se dice el día y los años que cumple.
  const birthdayText = (r) => {
    if (!r.birthdate) return null;
    const turns = new Date().getFullYear() - Number(String(r.birthdate).slice(0, 4));
    return `${formatDayMonth(r.birthdate)} · cumple ${turns}`;
  };

  const columns = [
    { key: 'member_name', header: 'Afiliado', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.member_name}</span> },
    ...(birthdayMonth ? [{
      key: 'birthdate', header: 'Cumpleaños', width: 180,
      render: (r) => birthdayText(r) || <span className={s.faint}>—</span>,
    }] : []),
    {
      key: 'subscription', header: 'Membresía', width: 200,
      render: (r) => membershipBadges(membership(r)),
    },
    {
      key: 'end_date', header: 'Vence', width: 130,
      render: (r) => membership(r).endDate || <span className={s.faint}>—</span>,
    },
    {
      // Saldo por cobrar de la suscripción activa; una cancelada no es deuda.
      key: 'saldo', header: 'Saldo', width: 120, align: 'right',
      render: (r) => {
        const { pending } = membership(r);
        return pending > 0 ? <span className={gl.saldo}>{gymMoney(pending)}</span> : <span className={s.faint}>—</span>;
      },
    },
  ];

  const filtered = !!(status || membershipFilter || birthdayMonth || search);
  const emptyText = filtered ? 'No hay afiliados para los filtros seleccionados.' : 'No hay afiliados registrados.';

  const filterDefs = [
    { key: 'status', type: 'select', label: 'Afiliado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
    { key: 'membership', type: 'select', label: 'Membresía', icon: 'fas fa-id-card', options: GYM_MEMBERSHIP_OPTIONS },
    { key: 'birthday_month', type: 'select', label: 'Cumpleaños', icon: 'fas fa-cake-candles', options: MONTH_OPTIONS, placeholder: 'Cualquier mes' },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar por nombre, código o documento"
        filters={filterDefs}
        values={{ status, membership: membershipFilter, birthday_month: birthdayMonth }}
        onChange={(next) => setQuery({ status: next.status, membership: next.membership, birthday_month: next.birthday_month })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin afiliados' : `${pg.total} afiliado${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>
              Nuevo afiliado
            </Button>
          </>
        }
      />

      <div className={s.desktopList}>
        <Card>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            empty={emptyText}
            onRowClick={(r) => navigate(`/gym/members/${r.id}?${params.toString()}`)}
          />
        </Card>
      </div>

      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><Alert tone="danger" title="No se pudieron cargar los afiliados">{error}</Alert></Card>
        )}
        {!loading && !error && rows.length === 0 && (
          <Card><div className={s.mobileState}>{emptyText}</div></Card>
        )}
        {/* Cada afiliado es una tarjeta con marco: arriba quién es (avatar y nombre) y abajo su
            membresía. Toda la zona de identidad navega a la ficha; la única acción aparte es
            Suscribir, y solo cuando no tiene membresía activa. */}
        {!loading && !error && rows.map((r) => {
          const ms = membership(r);
          return (
            <ListCard key={r.id}
              media={<Avatar name={r.member_name} size="sm" />}
              title={r.member_name}
              subtitle={birthdayText(r)}
              badge={membershipBadges(ms)}
              meta={ms.pending > 0
                ? <>{ms.detail && <>{ms.detail} · </>}<span className={gl.saldo}>saldo {gymMoney(ms.pending)}</span></>
                : ms.detail}
              action={!ms.alive ? (
                <Button variant="secondary" size="sm" icon="fas fa-plus"
                  onClick={() => navigate(`/gym/members/${r.id}?action=subscribe`)}>
                  Suscribir
                </Button>
              ) : null}
              onClick={() => navigate(`/gym/members/${r.id}?${params.toString()}`)} />
          );
        })}
      </div>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}

      <Modal
        open={!!wiz}
        title={wiz?.step === 'search' ? 'Buscar a la persona' : 'Nuevo afiliado'}
        onClose={closeWizard}
        footer={wiz?.step === 'search' ? (
          <>
            <Button variant="secondary" onClick={closeWizard}>Cancelar</Button>
            {wiz?.affiliated ? (
              <Button variant="primary" icon="fas fa-arrow-right"
                onClick={() => navigate(`/gym/members/${wiz.affiliated.id}`)}>
                Ver su ficha
              </Button>
            ) : (
              <Button variant="primary" icon="fas fa-magnifying-glass" loading={wiz?.searching} onClick={searchPerson}>
                Buscar
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary"
              onClick={() => { setFormError(''); setWiz((w) => ({ ...w, step: 'search', account: null })); }}>
              Atrás
            </Button>
            <Button variant="primary" loading={saving} onClick={save}>Registrar</Button>
          </>
        )}>
        {wiz?.step === 'search' && (
          <div className={s.formCol}>
            <p className={s.faint}>
              Antes de crear la ficha buscamos a la persona: si ya tiene cuenta en la plataforma
              (por otra compañía, una reserva o un pedido) se reutiliza en vez de duplicarla.
            </p>
            <Input label="Celular o correo" icon="fas fa-magnifying-glass" autoFocus
              placeholder="3001234567 o persona@correo.com"
              hint="Con @ se busca por correo; si no, por celular."
              value={wiz.contact}
              onChange={(e) => setWiz((w) => ({ ...w, contact: e.target.value, affiliated: null }))}
              onKeyDown={(e) => { if (e.key === 'Enter') searchPerson(); }} />
            {wiz.affiliated && (
              <Alert tone="warning" variant="tint" title="Esta persona ya está afiliada">
                {wiz.affiliated.member_name} · {wiz.affiliated.member_code}
                {Number(wiz.affiliated.status) === 0 ? ' · ficha inactiva' : ''}
              </Alert>
            )}
            {formError && <Alert tone="danger" onClose={() => setFormError('')}>{formError}</Alert>}
          </div>
        )}
        {wiz?.step === 'form' && (
          <div className={s.formCol}>
            {wiz.account ? (
              <>
                <Alert tone="success" title="Ya tiene cuenta: la reutilizamos">
                  {`${wiz.account.first_name} ${wiz.account.last_name}`.trim()}
                  {wiz.account.phone_number ? ` · ${wiz.account.phone_number}` : ''}
                  {wiz.account.email ? ` · ${wiz.account.email}` : ''}
                </Alert>
                <p className={s.faint}>
                  Sus datos personales se editan después desde la ficha, en “Editar datos”.
                  Aquí solo completas lo del gimnasio.
                </p>
                {!wiz.account.id_number && (
                  <div className={s.formGrid}>
                    <Select label="Tipo de documento" icon="fas fa-id-card" value={wiz.form.id_type_id}
                      onChange={(e) => setForm({ id_type_id: e.target.value })} options={ID_TYPES} />
                    <Input label="Número de documento (opcional)" icon="fas fa-hashtag" inputMode="numeric"
                      value={wiz.form.id_number} onChange={(e) => setForm({ id_number: e.target.value })} />
                  </div>
                )}
              </>
            ) : (
              <>
                <Alert tone="info" title="No encontramos a esta persona">
                  Se creará su cuenta en la plataforma con los datos que registres aquí.
                </Alert>
                <div className={s.formGrid}>
                  <Input label="Nombres" icon="fas fa-user" autoFocus value={wiz.form.first_name}
                    onChange={(e) => setForm({ first_name: e.target.value })} />
                  <Input label="Apellidos" icon="fas fa-user" value={wiz.form.last_name}
                    onChange={(e) => setForm({ last_name: e.target.value })} />
                </div>
                <div className={s.formGrid}>
                  <Input label="Celular" icon="fas fa-phone" type="tel" inputMode="tel"
                    value={wiz.form.phone_number} onChange={(e) => setForm({ phone_number: e.target.value })} />
                  <Input label="Correo (opcional)" icon="fas fa-envelope" type="email" inputMode="email"
                    value={wiz.form.email} onChange={(e) => setForm({ email: e.target.value })} />
                </div>
                <div className={s.formGrid}>
                  <Select label="Tipo de documento" icon="fas fa-id-card" value={wiz.form.id_type_id}
                    onChange={(e) => setForm({ id_type_id: e.target.value })} options={ID_TYPES} />
                  <Input label="Número de documento" icon="fas fa-hashtag" inputMode="numeric"
                    value={wiz.form.id_number} onChange={(e) => setForm({ id_number: e.target.value })} />
                </div>
              </>
            )}
            <div className={s.formGrid}>
              <Select label="Sexo" icon="fas fa-venus-mars" value={wiz.form.sex}
                onChange={(e) => setForm({ sex: e.target.value })}
                options={[{ value: '', label: 'Selecciona…' }, ...GYM_SEX_OPTIONS]} />
              <Input label="Talla (cm, opcional)" type="number" inputMode="decimal" min="0" icon="fas fa-ruler-vertical"
                value={wiz.form.height_cm} onChange={(e) => setForm({ height_cm: e.target.value })} />
            </div>
            {/* Se guarda la fecha, no la edad: así los años que tiene el afiliado salen solos
                cada vez que se mira su ficha. */}
            <DatePicker label="Fecha de nacimiento (opcional)" icon="fas fa-cake-candles"
              captionLayout="dropdown" min={OLDEST_BIRTHDATE()} max={todayIso()}
              hint={birthdateHint}
              value={wiz.form.birthdate} onChange={(d) => setForm({ birthdate: d })} />
            <Select label="Objetivo (opcional)" icon="fas fa-bullseye" value={wiz.form.goal_id}
              onChange={(e) => setForm({ goal_id: e.target.value })} options={goalOptions} />
            <Textarea label="Notas de salud (opcional)" placeholder="Lesiones, condiciones a tener en cuenta…"
              value={wiz.form.health_notes} onChange={(e) => setForm({ health_notes: e.target.value })} />
            {formError && <Alert tone="danger" onClose={() => setFormError('')}>{formError}</Alert>}
          </div>
        )}
      </Modal>
    </div>
  );
}
