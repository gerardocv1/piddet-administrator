import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Select, MoneyInput, PageHeader, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';

const TYPE_OPTIONS = [
  { value: 'GLOBAL', label: 'Global (toda la compañía)' },
  { value: 'EMPLOYEE', label: 'Cajero (un empleado)' },
];

// Apertura de un turno de caja: tipo, base de dinero y, para turnos de cajero abiertos por un
// admin, el empleado asignado. El tipo GLOBAL solo aparece con `shift-global-admin` (único
// permiso que lo administra). El cajero (api-module-shifts-own sin el permiso admin) solo
// puede abrir SU turno: el tipo va fijo en EMPLOYEE y el backend lo asigna a él mismo.
export function ShiftOpen() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { toast } = useToast();
  const isAdmin = can('api-module-shifts');
  const canGlobal = can('shift-global-admin');

  useSetPageTitle('Abrir turno');

  const [type, setType] = React.useState(canGlobal ? 'GLOBAL' : 'EMPLOYEE');
  const [assignedUserId, setAssignedUserId] = React.useState('');
  const [baseAmount, setBaseAmount] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Usuarios de la compañía para el selector de asignado (solo admin y solo tipo Cajero).
  const usersFetcher = React.useCallback(
    () => (isAdmin ? api.users({ row: 100 }) : Promise.resolve({ items: [] })),
    [isAdmin],
  );
  const { data: usersData } = useResource(usersFetcher, { items: [] }, [isAdmin]);
  const userOptions = React.useMemo(
    () => [
      { value: '', label: 'Yo mismo' },
      ...(usersData.items || []).map((u) => ({ value: String(u.id), label: u.name })),
    ],
    [usersData],
  );

  const valid = Number(baseAmount) >= 0 && baseAmount !== '';

  const submit = async () => {
    if (saving || !valid) return;
    setSaving(true);
    setErr(null);
    try {
      const shift = await api.openShift({
        type,
        base_amount: Number(baseAmount),
        ...(isAdmin && type === 'EMPLOYEE' && assignedUserId ? { assigned_user_id: Number(assignedUserId) } : {}),
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
            {canGlobal ? (
              <Select label="Tipo de turno" icon="fas fa-cash-register"
                value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS}
                hint={type === 'GLOBAL'
                  ? 'Registra todas las ventas y gastos de la compañía. No se puede cerrar con turnos de cajero abiertos.'
                  : 'Registra solo lo que venda y gaste el empleado asignado mientras su turno esté abierto.'} />
            ) : isAdmin ? (
              <p className={s.muted}>
                <i className="fas fa-cash-register" /> Abrirás un <strong>turno de cajero</strong>. El turno
                global requiere el permiso de administración del turno global.
              </p>
            ) : (
              <p className={s.muted}>
                <i className="fas fa-cash-register" /> Abrirás <strong>tu turno de cajero</strong>: registrará
                las ventas y gastos que hagas mientras esté abierto.
              </p>
            )}

            {isAdmin && type === 'EMPLOYEE' && (
              <Select label="Asignado a" icon="fas fa-user"
                value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}
                options={userOptions} />
            )}

            <MoneyInput label="Base en caja" icon="fas fa-dollar-sign" placeholder="0"
              value={baseAmount} onChange={setBaseAmount}
              hint="Dinero en efectivo con el que arranca la caja." />

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
