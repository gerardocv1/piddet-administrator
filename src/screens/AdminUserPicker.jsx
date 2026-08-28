import React from 'react';
import { Button, Input, Select, Checkbox, Avatar, Alert } from '../components';
import s from './screens.module.css';

const USER_TYPE_CLIENT = '1';
const USER_TYPE_EMPLOYEE = '2';

/**
 * Selección de un usuario de la plataforma por teléfono: primero se BUSCA y, según el resultado,
 * se vincula el que ya existe o se crean sus datos. Mismo flujo que el módulo de usuarios de la
 * compañía; aquí se reutiliza en la administración maestra (alta de compañía y alta de usuarios
 * de cualquier compañía), por eso la función de búsqueda se inyecta.
 *
 * Notifica al padre con `onChange({ valid, payload })`: `payload` es lo que espera el backend,
 * ya sea `{ user_id }` (vincular) o los datos completos (crear).
 */
export function AdminUserPicker({ search, onChange, roles = null, showUserType = false }) {
  const [form, setForm] = React.useState({
    first_name: '', last_name: '', email: '', phone_code: '57', phone_number: '', password: '',
    user_type_id: USER_TYPE_EMPLOYEE,
  });
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [result, setResult] = React.useState(null);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (name) =>
    setSelectedRoles((xs) => (xs.includes(name) ? xs.filter((x) => x !== name) : [...xs, name]));

  const mode = !result ? 'search'
    : result.exists && result.linked ? 'linked'
    : result.exists ? 'link'
    : 'create';

  const runSearch = async () => {
    const phone = form.phone_number.trim();
    if (!phone) return;
    setSearching(true);
    setSearchError(null);
    setResult(null);
    try {
      const r = await search(phone);
      setResult(r);
      if (r?.exists && r.user) {
        setForm((f) => ({
          ...f,
          first_name: r.user.first_name || '',
          last_name: r.user.last_name || '',
          email: r.user.email || '',
          phone_code: r.user.phone_code || f.phone_code,
        }));
      }
    } catch (e) {
      setSearchError(e?.message || 'No se pudo realizar la búsqueda.');
    } finally {
      setSearching(false);
    }
  };

  // Cambiar el teléfono invalida la búsqueda anterior: obliga a buscar de nuevo.
  const onPhoneChange = (v) => { set('phone_number', v); if (result) setResult(null); };

  // El padre solo necesita saber si hay un usuario listo y con qué cuerpo mandarlo.
  React.useEffect(() => {
    const extra = {
      ...(roles ? { roles: selectedRoles } : {}),
      ...(showUserType ? { user_type_id: Number(form.user_type_id) } : {}),
    };
    if (mode === 'link') {
      onChange({ valid: true, payload: { user_id: result.user.id, ...extra } });
    } else if (mode === 'create') {
      const valid = !!(form.first_name.trim() && form.last_name.trim()
        && form.phone_number.trim() && form.password.length >= 8);
      onChange({
        valid,
        payload: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          phone_code: form.phone_code.trim(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          ...extra,
        },
      });
    } else {
      onChange({ valid: false, payload: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, form, selectedRoles, result]);

  return (
    <>
      <div className={s.formGrid}>
        <Input label="Código" icon="fas fa-globe" value={form.phone_code}
          onChange={(e) => set('phone_code', e.target.value)} />
        <Input label="Teléfono" icon="fas fa-phone" placeholder="300 000 0000" value={form.phone_number}
          onChange={(e) => onPhoneChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }} />
      </div>

      {mode === 'search' && (
        <Button variant="outline-primary" icon="fas fa-magnifying-glass" loading={searching}
          disabled={!form.phone_number.trim()} onClick={runSearch}>
          Buscar usuario
        </Button>
      )}

      {searchError && <Alert tone="danger" onClose={() => setSearchError(null)}>{searchError}</Alert>}

      {mode === 'linked' && (
        <Alert tone="info" variant="tint">
          <strong>{result.user.name}</strong> ya pertenece a esta compañía.
        </Alert>
      )}

      {mode === 'link' && (
        <>
          <div className={s.user}><Avatar name={result.user.name} size="sm" />{result.user.name}</div>
          <span className={s.muted}>Usuario encontrado en la plataforma. Se vinculará a la compañía.</span>
        </>
      )}

      {mode === 'create' && (
        <>
          <span className={s.muted}>No existe un usuario con ese teléfono. Completa sus datos para crearlo.</span>
          <div className={s.formGrid}>
            <Input label="Nombre" icon="fas fa-user" value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)} />
            <Input label="Apellido" icon="fas fa-user" value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)} />
          </div>
          <Input label="Correo (opcional)" icon="fas fa-envelope" type="email" value={form.email}
            onChange={(e) => set('email', e.target.value)} />
          <Input label="Contraseña" icon="fas fa-lock" type="password" hint="Mínimo 8 caracteres"
            value={form.password} onChange={(e) => set('password', e.target.value)} />
        </>
      )}

      {showUserType && (mode === 'link' || mode === 'create') && (
        <Select label="Tipo de usuario" icon="fas fa-id-badge" value={form.user_type_id}
          hint="Los empleados operan la compañía; los clientes solo consumen sus servicios."
          onChange={(e) => set('user_type_id', e.target.value)}>
          <option value={USER_TYPE_EMPLOYEE}>Empleado</option>
          <option value={USER_TYPE_CLIENT}>Cliente</option>
        </Select>
      )}

      {roles && (mode === 'link' || mode === 'create') && (
        <div className={s.formCol}>
          <span className={s.muted}>Roles en la compañía</span>
          <div className={s.permGroups}>
            {roles.length === 0 && <span className={s.faint}>No hay roles disponibles.</span>}
            {roles.map((r) => (
              <Checkbox key={r.name} label={r.label || r.name}
                checked={selectedRoles.includes(r.name)} onChange={() => toggleRole(r.name)} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
