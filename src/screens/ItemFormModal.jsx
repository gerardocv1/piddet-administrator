import React from 'react';
import { Button, Input, MoneyInput, Select, Switch, Textarea, Modal, CategoryCascader, EmojiPickerField, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { SERVICE_ITEM_TYPE_ID } from '../lib/services/itemTypes.js';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import { entityTerm, cap } from '../lib/terms.js';
import s from './screens.module.css';

// Modal de crear/editar un producto (item). Compartido por el listado (Products) y el detalle
// (ProductDetail). Carga tipos e impuestos; las categorías dependen del tipo elegido. El selector
// de impuesto solo aparece si la compañía tiene activa la funcionalidad `functionality_taxes`.
export function ItemFormModal({ item, onClose, onSaved }) {
  const editing = !!item;
  const { has } = useFunctionalities();
  const { toast } = useToast();
  // Terminología por tipo de compañía: el "producto" puede llamarse "ítem" o "servicio".
  const prodT = entityTerm('product');
  const taxesOn = has('functionality_taxes');
  const reservationsOn = has('functionality_reservations');

  const [types, setTypes] = React.useState([]);
  const [taxes, setTaxes] = React.useState([]);
  const [tree, setTree] = React.useState([]);
  const [loadingCats, setLoadingCats] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    item_type_id: item?.item_type_id ? String(item.item_type_id) : '',
    item_category_id: item?.item_category_id ? String(item.item_category_id) : '',
    name: item?.name || '',
    code: item?.code || '',
    description: item?.description || '',
    value: item?.value != null ? String(item.value) : '',
    tax_family_id: item?.tax_family_id ? String(item.tax_family_id) : '',
    reservable: !!item?.reservable,
    icon: item?.icon || '',
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [iconSuggestion, setIconSuggestion] = React.useState(null);
  const [suggestingIcon, setSuggestingIcon] = React.useState(false);

  // Tipos (siempre) e impuestos (solo si la funcionalidad está activa).
  React.useEffect(() => {
    api.itemTypes().then((d) => setTypes(d.items || [])).catch(() => {});
  }, []);
  React.useEffect(() => {
    if (!taxesOn) return;
    api.taxes().then((d) => setTaxes(Array.isArray(d) ? d : [])).catch(() => {});
  }, [taxesOn]);

  // Árbol de categorías del tipo seleccionado (se recarga al cambiar el tipo).
  const typeId = form.item_type_id;
  React.useEffect(() => {
    if (!typeId) { setTree([]); return; }
    let alive = true;
    setLoadingCats(true);
    api.itemCategoriesTree({ typeId })
      .then((d) => { if (alive) setTree(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setTree([]); })
      .finally(() => { if (alive) setLoadingCats(false); });
    return () => { alive = false; };
  }, [typeId]);

  // Sugerencia en vivo del icono automático: solo mientras el usuario no eligió uno manualmente,
  // y solo con algo de qué partir (nombre o categoría). Con debounce para no llamar en cada tecla.
  const nameForSuggestion = form.name.trim();
  const categoryForSuggestion = form.item_category_id;
  React.useEffect(() => {
    if (form.icon || (!nameForSuggestion && !categoryForSuggestion)) {
      setIconSuggestion(null);
      return undefined;
    }
    let alive = true;
    setSuggestingIcon(true);
    const timer = setTimeout(() => {
      api.iconSuggestion({ name: nameForSuggestion, categoryId: categoryForSuggestion, typeId: form.item_type_id })
        .then((d) => { if (alive) setIconSuggestion(d); })
        .catch(() => { if (alive) setIconSuggestion(null); })
        .finally(() => { if (alive) setSuggestingIcon(false); });
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [form.icon, nameForSuggestion, categoryForSuggestion, form.item_type_id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // Cambiar el tipo invalida la categoría elegida (las categorías pertenecen a un tipo).
  const onChangeType = (v) => setForm((f) => ({ ...f, item_type_id: v, item_category_id: '' }));
  const isService = Number(form.item_type_id) === SERVICE_ITEM_TYPE_ID;

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
      reservable: isService && reservationsOn && form.reservable,
      icon: form.icon || null,
    };
    // El impuesto solo se envía cuando la funcionalidad está activa (si no, el backend lo acepta nulo).
    if (taxesOn && form.tax_family_id) payload.tax_family_id = Number(form.tax_family_id);
    try {
      if (editing) await api.updateItem(item.id, payload);
      else await api.createItem(payload);
      onSaved();
      toast({ tone: 'success', title: editing ? `${cap(prodT.one)} guardado` : `${cap(prodT.one)} creado` });
    } catch (e) {
      setErr(e?.message || `No se pudo guardar el ${prodT.one}.`);
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? `Editar ${prodT.one}` : `Nuevo ${prodT.one}`}
      subtitle={editing ? item.name : `Crea un ${prodT.one} del catálogo de la compañía`}
      size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Select label="Tipo" value={form.item_type_id} onChange={(e) => onChangeType(e.target.value)}
          options={[{ value: '', label: 'Selecciona un tipo' }, ...types.map((t) => ({ value: String(t.id), label: t.name }))]} />
        {!form.item_type_id ? (
          <Select label="Categoría" disabled options={[{ value: '', label: 'Elige un tipo primero' }]} />
        ) : (
          <CategoryCascader
            tree={tree}
            value={form.item_category_id}
            loading={loadingCats}
            onChange={(id) => set('item_category_id', id)}
          />
        )}
        <Input label={`Nombre del ${prodT.one}`} icon="fas fa-burger" placeholder="Ej. Hamburguesa Doble"
          value={form.name} onChange={(e) => set('name', e.target.value)} />
        <EmojiPickerField label={`Emoji del ${prodT.one}`} value={form.icon} onChange={(v) => set('icon', v)}
          suggestion={iconSuggestion} suggesting={suggestingIcon}
          hint="Si lo dejas en automático, se asigna según el nombre y la categoría." />
        <div className={s.formGrid}>
          <Input label="Código" icon="fas fa-barcode" placeholder="Opcional"
            value={form.code} onChange={(e) => set('code', e.target.value)} />
          <MoneyInput label="Valor de venta" icon="fas fa-dollar-sign" placeholder="0"
            value={form.value} onChange={(v) => set('value', v)} />
        </div>
        {taxesOn && (
          <Select label="Impuesto" value={form.tax_family_id} onChange={(e) => set('tax_family_id', e.target.value)}
            options={[{ value: '', label: 'Selecciona un impuesto' }, ...taxes.map((tx) => ({ value: String(tx.id), label: tx.name }))]} />
        )}
        {isService && reservationsOn && (
          <Switch label="Disponible para reservas (se ofrece como servicio adicional al reservar hospedaje)"
            checked={form.reservable} onChange={(e) => set('reservable', e.target.checked)} />
        )}
        <Textarea label="Descripción" placeholder={`Describe el ${prodT.one}`}
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
