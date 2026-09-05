import React from 'react';
import { Button, Input, MoneyInput, Textarea, Select, Switch, Modal, Alert, useToast } from '../components';
import s from './screens.module.css';

// Modales compartidos de grupos de opciones y opciones. Los usa el detalle de producto (grupos
// del producto) y el módulo de opciones generales (grupos de la compañía): la forma del grupo y
// de la opción es la misma en ambos, solo cambia el endpoint, que inyecta el padre en `onSubmit`.

// Tipos de grupo, como los define el backend (`item_option_groups.type`). Un grupo REMOVE agrupa
// ingredientes que el cliente pide quitar: sus opciones no tienen precio y el POS las imprime
// con signo menos («− Cebolla»). Cualquier otro valor se trata como grupo normal.
export const GROUP_TYPE_OPTION = 'OPTION';
export const GROUP_TYPE_REMOVE = 'REMOVE';
const GROUP_TYPES = [
  { value: GROUP_TYPE_OPTION, label: 'Opciones o adiciones (pueden tener precio)' },
  { value: GROUP_TYPE_REMOVE, label: 'Ingredientes para quitar (sin costo, salen con − en la factura)' },
];
export const isRemoveGroup = (g) => g?.type === GROUP_TYPE_REMOVE;

export const fmtPrice = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CO'));
export const extraPrice = (n) => (Number(n) > 0 ? '+' + fmtPrice(n) : 'Sin costo');

// Resumen legible de las reglas de selección de un grupo.
export function rulesText(g) {
  const kind = g.multiple ? 'Selección múltiple' : 'Selección única';
  const min = Number(g.min) || 0;
  const max = Number(g.max) || 0;
  const range = max > 0 ? `mín. ${min} · máx. ${max}` : (min > 0 ? `mín. ${min}` : 'sin límite');
  return `${isRemoveGroup(g) ? 'Para quitar · ' : ''}${kind} · ${range}`;
}

// ── Modal: crear/editar un grupo de opciones (reglas de selección) ──
// `onSubmit(payload)` persiste (crear o editar según `group`) y devuelve una promesa.
export function GroupFormModal({ group, onSubmit, onClose, onSaved, subtitle }) {
  const { toast } = useToast();
  const editing = !!group;
  const [form, setForm] = React.useState(() => ({
    name: group?.name || '',
    // Los grupos viejos pueden traer otros valores (`OPTIONS`); todo lo que no sea REMOVE es normal.
    type: isRemoveGroup(group) ? GROUP_TYPE_REMOVE : GROUP_TYPE_OPTION,
    description: group?.description || '',
    min: group?.min != null ? String(group.min) : '0',
    max: group?.max != null ? String(group.max) : '0',
    multiple: group ? !!group.multiple : false,
    status: group ? !!group.status : true,
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [fieldErr, setFieldErr] = React.useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErr[k]) setFieldErr((e) => ({ ...e, [k]: undefined }));
  };

  // Validación en línea: el error se queda junto al campo, nunca en un toast ni en silencio.
  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'El nombre del grupo es obligatorio.';
    const min = Number(form.min) || 0;
    const max = Number(form.max) || 0;
    if (min < 0) errors.min = 'No puede ser negativo.';
    if (max < 0) errors.max = 'No puede ser negativo.';
    if (max > 0 && min > max) errors.min = 'El mínimo no puede superar al máximo.';
    setFieldErr(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    setErr(null);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      min: Number(form.min) || 0,
      max: Number(form.max) || 0,
      multiple: form.multiple,
      status: form.status,
    };
    try {
      await onSubmit(payload);
      onSaved();
      toast({ tone: 'success', title: editing ? 'Grupo guardado' : 'Grupo creado' });
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el grupo.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? 'Editar grupo' : 'Nuevo grupo de opciones'}
      subtitle={subtitle ?? 'Define las reglas de selección que verá el cliente'} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre del grupo" icon="fas fa-list-check"
          placeholder={form.type === GROUP_TYPE_REMOVE ? 'Ej. Quitar ingredientes' : 'Ej. Adiciones'}
          error={fieldErr.name} value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Select label="Tipo de grupo" icon="fas fa-tags" options={GROUP_TYPES}
          hint={form.type === GROUP_TYPE_REMOVE
            ? 'Las opciones de este grupo no llevan precio: al marcarlas, el POS las imprime como «− ingrediente».'
            : 'Términos, tamaños o adiciones. Cada opción puede tener un precio extra.'}
          value={form.type} onChange={(e) => set('type', e.target.value)} />
        <Textarea label="Descripción" placeholder="Opcional"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        <div className={s.formGrid}>
          <Input label="Mínimo de selección" icon="fas fa-arrow-down-1-9" type="number" min="0"
            error={fieldErr.min} value={form.min} onChange={(e) => set('min', e.target.value)} />
          <Input label="Máximo de selección" icon="fas fa-arrow-up-1-9" type="number" min="0"
            hint="0 = sin límite" error={fieldErr.max} value={form.max} onChange={(e) => set('max', e.target.value)} />
        </div>
        <Switch label="Selección múltiple (permite elegir varias opciones)"
          checked={form.multiple} onChange={(e) => set('multiple', e.target.checked)} />
        <Switch label="Grupo activo" checked={form.status} onChange={(e) => set('status', e.target.checked)} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: crear/editar una opción (precio extra) ──
// En un grupo «para quitar» la opción es un ingrediente: no se pide precio y viaja con valor 0.
// `onSubmit(payload)` persiste (crear o editar según `option`) y devuelve una promesa.
export function OptionFormModal({ groupType, option, onSubmit, onClose, onSaved }) {
  const { toast } = useToast();
  const editing = !!option;
  const remove = groupType === GROUP_TYPE_REMOVE;
  const [name, setName] = React.useState(option?.name || '');
  const [value, setValue] = React.useState(option?.value != null ? String(option.value) : '');
  const [status, setStatus] = React.useState(option ? Number(option.status) === 1 : true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [nameErr, setNameErr] = React.useState('');

  const submit = async () => {
    const n = name.trim();
    if (!n) { setNameErr(remove ? 'El nombre del ingrediente es obligatorio.' : 'El nombre de la opción es obligatorio.'); return; }
    setSaving(true);
    setErr(null);
    const payload = {
      name: n,
      value: remove ? 0 : (value.trim() ? Number(value) : 0),
      status: status ? 1 : 0,
    };
    try {
      await onSubmit(payload);
      onSaved();
      toast({ tone: 'success', title: editing ? 'Opción guardada' : 'Opción creada' });
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar la opción.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open
      title={remove ? (editing ? 'Editar ingrediente' : 'Nuevo ingrediente para quitar') : (editing ? 'Editar opción' : 'Nueva opción')}
      subtitle={remove ? 'Se ofrecerá como «sin …» y no cambia el precio' : undefined}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label={remove ? 'Ingrediente' : 'Nombre de la opción'} icon={remove ? 'fas fa-minus-circle' : 'fas fa-circle-dot'}
          placeholder={remove ? 'Ej. Cebolla' : 'Ej. Tocineta'} error={nameErr}
          value={name} onChange={(e) => { setName(e.target.value); if (nameErr) setNameErr(''); }} />
        {!remove && (
          <MoneyInput label="Precio extra" icon="fas fa-dollar-sign" placeholder="0 (sin costo)"
            value={value} onChange={setValue} />
        )}
        <Switch label={remove ? 'Ingrediente activo' : 'Opción activa'} checked={status} onChange={(e) => setStatus(e.target.checked)} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
