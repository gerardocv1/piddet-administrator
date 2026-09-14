import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Select, MoneyInput, Checkbox, PageHeader, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { auth } from '../lib/auth/index.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';

const GLOBAL_OPTION = { value: 'GLOBAL', label: 'Global (toda la compañía)' };
const ASSIGNED_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Cajero (vende y gasta)' },
  { value: 'PURCHASE', label: 'Compras (solo gasta)' },
];

const TYPE_HINTS = {
  GLOBAL: 'Registra todas las ventas y gastos de la compañía. No se puede cerrar con turnos de cajero o de compras abiertos.',
  EMPLOYEE: 'Registra solo lo que vendan y gasten los empleados asignados mientras el turno esté abierto.',
  PURCHASE: 'Para quien solo compra: arranca con una base, se le suman adiciones durante el turno y registra los gastos. Al cerrar solo se anota la diferencia, sin factura ni gasto de respaldo.',
};

// Tipo de usuario dentro de la compañía (company_users.user_type_id).
const USER_TYPE_EMPLOYEE = '2';

const BASE_HINTS = {
  PURCHASE: 'Dinero entregado para las compras. Se le podrán sumar adiciones mientras el turno esté abierto.',
};

// Apertura de un turno de caja: tipo, base de dinero y, para turnos de cajero o de compras
// abiertos por un admin, los empleados asignados (uno o varios: una caja compartida entre dos o
// más personas registra lo que venda y gaste cualquiera de ellos). El tipo GLOBAL solo aparece
// con `shift-global-admin` (único permiso que lo administra). El cajero (api-module-shifts-own
// sin el permiso admin) solo puede abrir SU turno, de cajero o de compras: el backend lo asigna
// a él mismo. Un usuario no puede estar en dos turnos abiertos: el backend responde 409 con el
// nombre del que ya tiene uno.
export function ShiftOpen() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { toast } = useToast();
  const isAdmin = can('api-module-shifts');
  const canGlobal = can('shift-global-admin');
  const typeOptions = canGlobal ? [GLOBAL_OPTION, ...ASSIGNED_OPTIONS] : ASSIGNED_OPTIONS;

  useSetPageTitle('Abrir turno');

  const [type, setType] = React.useState(canGlobal ? 'GLOBAL' : 'EMPLOYEE');
  const assigned = type !== 'GLOBAL';
  // Ids de los usuarios asignados. Vacío = el propio usuario (el backend lo resuelve así).
  const [assignedUserIds, setAssignedUserIds] = React.useState([]);
  const me = auth.getUser();
  const myId = me?.id != null ? Number(me.id) : null;
  const [baseAmount, setBaseAmount] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Empleados de la compañía para el selector de asignados (solo admin y solo turnos de cajero
  // o de compras): un cliente no lleva caja. El usuario actual va primero, marcado como "yo",
  // para que abrir el propio turno siga siendo un clic.
  const usersFetcher = React.useCallback(
    () => (isAdmin ? api.users({ row: 100, userTypeId: USER_TYPE_EMPLOYEE }) : Promise.resolve({ items: [] })),
    [isAdmin],
  );
  const { data: usersData, loading: usersLoading } = useResource(usersFetcher, { items: [] }, [isAdmin]);
  const userOptions = React.useMemo(() => {
    const items = (usersData.items || []).map((u) => ({ id: Number(u.id), name: u.name }));
    const mine = items.find((u) => u.id === myId)
      || (myId != null ? { id: myId, name: me?.name || [me?.first_name, me?.last_name].filter(Boolean).join(' ') || 'Yo' } : null);
    const others = items.filter((u) => u.id !== myId);
    return mine ? [{ ...mine, me: true }, ...others] : others;
  }, [usersData, myId, me]);

  const toggleUser = (id) =>
    setAssignedUserIds((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const selectedNames = userOptions.filter((u) => assignedUserIds.includes(u.id)).map((u) => u.name);

  const valid = Number(baseAmount) >= 0 && baseAmount !== '';

  const submit = async () => {
    if (saving || !valid) return;
    setSaving(true);
    setErr(null);
    try {
      const shift = await api.openShift({
        type,
        base_amount: Number(baseAmount),
        ...(isAdmin && assigned && assignedUserIds.length ? { assigned_user_ids: assignedUserIds } : {}),
      });
      toast({ tone: 'success', title: 'Turno abierto' });
      navigate(`/shifts/${shift.id}`, { replace: true });
    } catch (e) {
      setErr(e?.message || 'No se pudo abrir el turno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <PageHeader onBack={() => navigate('/shifts')} title="Abrir turno" />

      <Card>
        <Card.Header title="Datos de apertura" />
        <Card.Body>
          <div className={s.formCol}>
            <Select label="Tipo de turno" icon="fas fa-cash-register"
              value={type} onChange={(e) => setType(e.target.value)} options={typeOptions}
              hint={TYPE_HINTS[type]} />

            {!canGlobal && isAdmin && (
              <p className={s.faint}>El turno global requiere el permiso de administración del turno global.</p>
            )}
            {!isAdmin && (
              <p className={s.muted}>
                <i className="fas fa-user" /> El turno será <strong>tuyo</strong>: registrará lo que
                {type === 'PURCHASE' ? ' gastes' : ' vendas y gastes'} mientras esté abierto.
              </p>
            )}

            {isAdmin && assigned && (
              <div className={s.formCol}>
                <span className={s.muted}>
                  <i className="fas fa-users" /> Asignado a
                  {selectedNames.length > 1 && <> · <strong>{selectedNames.length} personas</strong> comparten la caja</>}
                </span>
                <div className={s.permGroups}>
                  {usersLoading && userOptions.length === 0 && <span className={s.faint}>Cargando usuarios…</span>}
                  {!usersLoading && userOptions.length === 0 && <span className={s.faint}>No hay usuarios en la compañía.</span>}
                  {userOptions.map((u) => (
                    <Checkbox key={u.id} label={u.me ? `${u.name} (yo)` : u.name}
                      checked={assignedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
                  ))}
                </div>
                <span className={s.faint}>
                  {assignedUserIds.length === 0
                    ? 'Sin selección, el turno será tuyo. Marca dos o más personas para una caja compartida.'
                    : `Registrará lo que ${type === 'PURCHASE' ? 'gasten' : 'vendan y gasten'}: ${selectedNames.join(', ')}.`}
                </span>
              </div>
            )}

            <MoneyInput label={type === 'PURCHASE' ? 'Base para compras' : 'Base en caja'} icon="fas fa-dollar-sign" placeholder="0"
              value={baseAmount} onChange={setBaseAmount}
              hint={BASE_HINTS[type] || 'Dinero en efectivo con el que arranca la caja.'} />

            {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}

            <Button variant="primary" icon="fas fa-unlock" size="lg" disabled={!valid} loading={saving} onClick={submit}>
              Abrir turno
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
