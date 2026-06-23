import React from 'react';
import { Button, Input, Select, Textarea, Modal } from '../components';
import { api } from '../lib/api.js';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import s from './screens.module.css';

// Modal de crear/editar un producto (item). Compartido por el listado (Products) y el detalle
// (ProductDetail). Carga tipos e impuestos; las categorías dependen del tipo elegido. El selector
// de impuesto solo aparece si la compañía tiene activa la funcionalidad `functionality_taxes`.
export function ItemFormModal({ item, onClose, onSaved }) {
  const editing = !!item;
  const { has } = useFunctionalities();
  const taxesOn = has('functionality_taxes');

  const [types, setTypes] = React.useState([]);
  const [taxes, setTaxes] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  const [loadingCats, setLoadingCats] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    item_type_id: item?.item_type_id ? String(item.item_type_id) : '',
    item_category_id: item?.item_category_id ? String(item.item_category_id) : '',
    name: item?.name || '',
    code: item?.code || '',
    description: item?.description || '',
    value: item?.value != null ? String(item.value) : '',
    tax_family_id: item?.tax_family_id ? String(item.tax_family_id) : '',
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Tipos (siempre) e impuestos (solo si la funcionalidad está activa).
  React.useEffect(() => {
    api.itemTypes().then((d) => setTypes(d.items || [])).catch(() => {});
  }, []);
  React.useEffect(() => {
    if (!taxesOn) return;
    api.taxes().then((d) => setTaxes(Array.isArray(d) ? d : [])).catch(() => {});
  }, [taxesOn]);

  // Categorías del tipo seleccionado (se recargan al cambiar el tipo).
  const typeId = form.item_type_id;
  React.useEffect(() => {
    if (!typeId) { setCats([]); return; }
    let alive = true;
    setLoadingCats(true);
    api.allItemCategories({ typeId })
      .then((d) => { if (alive) setCats(d.items || []); })
      .catch(() => { if (alive) setCats([]); })
      .finally(() => { if (alive) setLoadingCats(false); });
    return () => { alive = false; };
  }, [typeId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // Cambiar el tipo invalida la categoría elegida (las categorías pertenecen a un tipo).
  const onChangeType = (v) => setForm((f) => ({ ...f, item_type_id: v, item_category_id: '' }));

  const valid = form.item_type_id && form.item_category_id && form.name.trim()
    && form.description.trim() && form.value !== '' && (!taxesOn || form.tax_family_id);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    const payload = {
      item_type_id: Number(form.item_type_id),
      item_category_id: Number(form.item_category_id),
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim(),
      value: Number(form.value),
    };
    // El impuesto solo se envía cuando la funcionalidad está activa (si no, el backend lo acepta nulo).
    if (taxesOn && form.tax_family_id) payload.tax_family_id = Number(form.tax_family_id);
    try {
      if (editing) await api.updateItem(item.id, payload);
      else await api.createItem(payload);
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el producto.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? 'Editar producto' : 'Nuevo producto'}
      subtitle={editing ? item.name : 'Crea un producto del catálogo de la compañía'}
      size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <div className={s.formGrid}>
          <Select label="Tipo" value={form.item_type_id} onChange={(e) => onChangeType(e.target.value)}
            options={[{ value: '', label: 'Selecciona un tipo' }, ...types.map((t) => ({ value: String(t.id), label: t.name }))]} />
          <Select label="Categoría" value={form.item_category_id} onChange={(e) => set('item_category_id', e.target.value)}
            disabled={!form.item_type_id || loadingCats}
            options={[{ value: '', label: !form.item_type_id ? 'Elige un tipo primero' : (loadingCats ? 'Cargando…' : 'Selecciona una categoría') }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))]} />
        </div>
        <Input label="Nombre del producto" icon="fas fa-burger" placeholder="Ej. Hamburguesa Doble"
          value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className={s.formGrid}>
          <Input label="Código" icon="fas fa-barcode" placeholder="Opcional"
            value={form.code} onChange={(e) => set('code', e.target.value)} />
          <Input label="Valor de venta" icon="fas fa-dollar-sign" type="number" placeholder="0"
            value={form.value} onChange={(e) => set('value', e.target.value)} />
        </div>
        {taxesOn && (
          <Select label="Impuesto" value={form.tax_family_id} onChange={(e) => set('tax_family_id', e.target.value)}
            options={[{ value: '', label: 'Selecciona un impuesto' }, ...taxes.map((tx) => ({ value: String(tx.id), label: tx.name }))]} />
        )}
        <Textarea label="Descripción" placeholder="Describe el producto"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}
