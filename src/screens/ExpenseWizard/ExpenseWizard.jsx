import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Textarea, Autocomplete, MoneyInput, MultiImageUpload, DatePicker, Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { todayIso } from '../../lib/orderLabels.js';
import { expenseMoney } from '../../lib/expenseLabels.js';
import t from './ExpenseWizard.module.css';

const STEPS = [
  { n: 1, label: 'Ítems' },
  { n: 2, label: 'Datos' },
  { n: 3, label: 'Foto' },
];

let itemSeq = 0;

// Asistente de registro de gastos optimizado para móvil (/expenses/quick). Guía paso a paso:
// 1) Ítems — por cada ítem se navega el árbol de categorías con filas tappables (una hoja se
//    elige directo; un nodo intermedio con «Usar “…”») y luego descripción + valor.
// 2) Datos — proveedor (con creación al vuelo), método de pago, fecha (hoy) y nota.
// 3) Foto — fotos de la factura (cámara o galería, con rotación) + confirmación.
// Mismo payload que el formulario clásico (/expenses/new); el backend no cambia.
export function ExpenseWizard() {
  const navigate = useNavigate();
  const photosRef = React.useRef(null);

  const [step, setStep] = React.useState(1);
  const [created, setCreated] = React.useState(null); // gasto creado → vista de éxito

  // Paso 1 — ítems del gasto y sub-flujo de captura (picker de categoría → editor).
  const [items, setItems] = React.useState([]); // [{ key, category:{id,name}, description, value }]
  const [path, setPath] = React.useState([]);   // camino de navegación en el árbol
  const [picking, setPicking] = React.useState(true);
  const [draft, setDraft] = React.useState(null); // { category, description, value }

  // Paso 2 — datos del encabezado.
  const [supplier, setSupplier] = React.useState(null);
  const [form, setForm] = React.useState({ expense_date: todayIso(), payment_method: '', notes: '' });

  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const treeFetcher = React.useCallback(() => api.expenseCategoriesTree(), []);
  const { data: tree, loading: loadingTree } = useResource(treeFetcher, [], []);
  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);

  const total = items.reduce((sum, it) => sum + (Number(it.value) || 0), 0);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ---- Paso 1: navegación del árbol ----
  const currentNodes = path.length ? (path[path.length - 1].children || []) : (tree || []);

  const enterOrPick = (node) => {
    if (node.children?.length) setPath((p) => [...p, node]);
    else startDraft(node);
  };
  const startDraft = (node) => {
    setDraft({ category: { id: node.id, name: node.name }, description: '', value: '' });
    setPicking(false);
  };

  const addItem = () => {
    if (!draft?.description.trim() || !(Number(draft.value) > 0)) return;
    setItems((prev) => [...prev, { key: ++itemSeq, ...draft, description: draft.description.trim() }]);
    setDraft(null);
    setPath([]);
    setPicking(false); // → lista de ítems
  };

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it.key !== key));

  const startNewItem = () => { setPath([]); setPicking(true); };

  // Vista activa dentro del paso 1.
  const view1 = draft ? 'editor' : (picking || items.length === 0) ? 'picker' : 'list';

  // ---- Barra inferior: Atrás contextual ----
  const goBack = () => {
    if (step === 3) { setStep(2); return; }
    if (step === 2) { setStep(1); setPicking(false); return; }
    // Paso 1
    if (view1 === 'editor') { setDraft(null); setPicking(true); return; }
    if (view1 === 'picker' && path.length) { setPath((p) => p.slice(0, -1)); return; }
    if (view1 === 'picker' && items.length) { setPicking(false); return; }
    navigate(-1); // sin nada empezado: salir del asistente
  };

  const step2Valid = supplier?.name?.trim() && form.payment_method && form.expense_date;

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);
    try {
      const files = await photosRef.current?.uploadAll() ?? [];
      const payload = {
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        notes: form.notes.trim() || undefined,
        ...(supplier.id ? { supplier_id: supplier.id } : { supplier_name: supplier.name.trim() }),
        items: items.map((it) => ({
          expense_category_id: Number(it.category.id),
          description: it.description,
          value: Number(it.value),
        })),
        files,
      };
      const expense = await api.createExpense(payload);
      setCreated(expense);
    } catch (e) {
      setErr(e?.message || 'No se pudo registrar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCreated(null);
    setItems([]);
    setPath([]);
    setPicking(true);
    setDraft(null);
    setSupplier(null);
    setForm({ expense_date: todayIso(), payment_method: '', notes: '' });
    setErr(null);
    setStep(1);
  };

  if (created) {
    return (
      <div className={t.wizard}>
        <div className={t.success}>
          <span className={t.successIcon}><i className="fas fa-check" /></span>
          <h2 className={t.successTitle}>Gasto registrado</h2>
          <p className={t.successTotal}>{expenseMoney(created.total)}</p>
          <p className={t.successMeta}>
            {items.length} ítem{items.length === 1 ? '' : 's'}
            {created.supplier?.name ? ` · ${created.supplier.name}` : ''}
          </p>
          <div className={t.successActions}>
            <Button variant="primary" icon="fas fa-receipt" onClick={() => navigate(`/expenses/${created.id}`)}>
              Ver gasto
            </Button>
            <Button variant="secondary" icon="fas fa-plus" onClick={reset}>
              Registrar otro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={t.wizard}>
      {/* Stepper compacto */}
      <ol className={t.stepper}>
        {STEPS.map((s2) => (
          <li key={s2.n}
            className={[t.step, step === s2.n ? t.stepActive : '', step > s2.n ? t.stepDone : ''].filter(Boolean).join(' ')}>
            <span className={t.stepDot}>{step > s2.n ? <i className="fas fa-check" /> : s2.n}</span>
            <span className={t.stepLabel}>{s2.label}</span>
          </li>
        ))}
      </ol>

      <div className={t.body}>
        {/* ---------- Paso 1: Ítems ---------- */}
        {step === 1 && view1 === 'picker' && (
          <div>
            <h3 className={t.heading}>
              {path.length === 0 ? '¿En qué categoría va el ítem?' : path[path.length - 1].name}
            </h3>
            {path.length > 0 && (
              <button type="button" className={t.useThis} onClick={() => startDraft(path[path.length - 1])}>
                <i className="fas fa-check-circle" /> Usar «{path[path.length - 1].name}»
              </button>
            )}
            {loadingTree ? (
              <Spinner center label="Cargando categorías…" />
            ) : (
              <ul className={t.catList}>
                {currentNodes.map((node) => (
                  <li key={node.id}>
                    <button type="button" className={t.catRow} onClick={() => enterOrPick(node)}>
                      <span className={t.catName}>{node.name}</span>
                      {node.children?.length > 0 && <i className={`fas fa-chevron-right ${t.catChevron}`} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 1 && view1 === 'editor' && (
          <div className={t.editor}>
            <h3 className={t.heading}>¿Qué compraste?</h3>
            <span className={t.catChip}><i className="fas fa-tag" /> {draft.category.name}</span>
            <Input label="Descripción" icon="fas fa-pen" placeholder="Ej. Cloro 30 kg" autoFocus
              value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <MoneyInput label="Valor" icon="fas fa-dollar-sign" placeholder="0"
              value={draft.value} onChange={(v) => setDraft({ ...draft, value: v })} />
            <Button variant="primary" icon="fas fa-plus" size="lg"
              disabled={!draft.description.trim() || !(Number(draft.value) > 0)} onClick={addItem}>
              Agregar ítem
            </Button>
          </div>
        )}

        {step === 1 && view1 === 'list' && (
          <div className={t.listView}>
            <h3 className={t.heading}>Ítems del gasto</h3>
            <ul className={t.itemList}>
              {items.map((it) => (
                <li key={it.key} className={t.itemRow}>
                  <div className={t.itemInfo}>
                    <span className={t.itemDesc}>{it.description}</span>
                    <span className={t.itemCat}><i className="fas fa-tag" /> {it.category.name}</span>
                  </div>
                  <span className={t.itemValue}>{expenseMoney(it.value)}</span>
                  <button type="button" className={t.itemRemove} onClick={() => removeItem(it.key)} aria-label="Quitar ítem">
                    <i className="fas fa-times" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={t.addItemRow} onClick={startNewItem}>
              <i className="fas fa-plus" /> Agregar otro ítem
            </button>
            {/* Solo el total queda anclado abajo, junto a la barra de acciones fija */}
            <div className={t.listBottom}>
              <div className={t.totalRow}>
                <span>Total</span>
                <strong>{expenseMoney(total)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Paso 2: Datos ---------- */}
        {step === 2 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Datos del gasto</h3>
            <Autocomplete
              label="Proveedor"
              icon="fas fa-truck-field"
              placeholder="Busca o escribe uno nuevo…"
              fetcher={(q) => api.expenseSuppliers(q)}
              value={supplier}
              onChange={setSupplier}
              minChars={2}
              creatable
              onCreate={(name) => setSupplier({ name })}
              hint={supplier && !supplier.id ? `Se creará el proveedor «${supplier.name}» al guardar.` : undefined}
            />
            <Select label="Método de pago" icon="fas fa-wallet"
              value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}
              options={[{ value: '', label: 'Selecciona el método' }, ...paymentMethods.map((m) => ({ value: m.id, label: m.name }))]} />
            <DatePicker label="Fecha del gasto" icon="fas fa-calendar" max={todayIso()}
              value={form.expense_date} onChange={(d) => set('expense_date', d)} />
            <Textarea label="Nota" placeholder="Comentario general (opcional)"
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        )}

        {/* ---------- Paso 3: Foto y confirmación ---------- */}
        {step === 3 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Foto de la factura</h3>
            <MultiImageUpload ref={photosRef} folder="expenses" visibility="private"
              hint="Opcional · toca la cámara para tomar la foto o elegirla de la galería · usa ⟳ si quedó de lado" />
            <div className={t.summary}>
              <div><span>Ítems</span><strong>{items.length}</strong></div>
              <div><span>Proveedor</span><strong>{supplier?.name || '—'}</strong></div>
              <div><span>Fecha</span><strong>{form.expense_date}</strong></div>
              <div className={t.summaryTotal}><span>Total</span><strong>{expenseMoney(total)}</strong></div>
            </div>
            {err && <div className={t.error}><i className="fas fa-triangle-exclamation" /> {err}</div>}
          </div>
        )}
      </div>

      {/* Barra de acciones sticky */}
      <div className={t.actionBar}>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={goBack} disabled={saving}>
          Atrás
        </Button>
        {step === 1 && (
          <Button variant="primary" icon="fas fa-arrow-right" disabled={view1 !== 'list' || items.length === 0}
            onClick={() => setStep(2)}>
            Continuar
          </Button>
        )}
        {step === 2 && (
          <Button variant="primary" icon="fas fa-arrow-right" disabled={!step2Valid} onClick={() => setStep(3)}>
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button variant="primary" icon="fas fa-check" loading={saving} onClick={submit}>
            Registrar gasto
          </Button>
        )}
      </div>
    </div>
  );
}
