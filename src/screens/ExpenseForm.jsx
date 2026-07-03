import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, IconButton, Input, Select, Textarea, Autocomplete, MoneyInput,
  CategoryCascader, MultiImageUpload, DatePicker,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { todayIso } from '../lib/orderLabels.js';
import { expenseMoney } from '../lib/expenseLabels.js';
import s from './screens.module.css';
import t from './ExpenseForm.module.css';

let lineSeq = 0;
const newLine = () => ({ key: ++lineSeq, categoryId: '', description: '', value: '' });

// Registro de un gasto: encabezado (fecha, proveedor con creación al vuelo, método de pago,
// nota) + líneas dinámicas (categoría, descripción libre, valor) + fotos de la factura
// (opcionales, privadas en S3). El total lo calcula el backend; aquí se muestra en vivo.
// Los gastos no se editan después: solo se anulan desde el detalle.
export function ExpenseForm() {
  const navigate = useNavigate();
  const photosRef = React.useRef(null);

  const [form, setForm] = React.useState({ expense_date: todayIso(), payment_method: '', notes: '' });
  // Proveedor elegido del catálogo ({id, name}) o creado al vuelo ({name}, sin id).
  const [supplier, setSupplier] = React.useState(null);
  const [lines, setLines] = React.useState([newLine()]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const treeFetcher = React.useCallback(() => api.expenseCategoriesTree(), []);
  const { data: tree, loading: loadingTree } = useResource(treeFetcher, [], []);

  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const paymentOptions = React.useMemo(
    () => [{ value: '', label: 'Selecciona el método' }, ...paymentMethods.map((m) => ({ value: m.id, label: m.name }))],
    [paymentMethods],
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setLine = (key, k, v) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [k]: v } : l)));
  const removeLine = (key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));

  const total = lines.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const valid = form.expense_date
    && form.payment_method
    && supplier?.name?.trim()
    && lines.length > 0
    && lines.every((l) => l.categoryId && l.description.trim() && Number(l.value) > 0);

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setErr(null);
    try {
      const files = await photosRef.current?.uploadAll() ?? [];
      const payload = {
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        notes: form.notes.trim() || undefined,
        ...(supplier.id ? { supplier_id: supplier.id } : { supplier_name: supplier.name.trim() }),
        items: lines.map((l) => ({
          expense_category_id: Number(l.categoryId),
          description: l.description.trim(),
          value: Number(l.value),
        })),
        files,
      };
      const created = await api.createExpense(payload);
      navigate(`/expenses/${created.id}`, { replace: true });
    } catch (e) {
      setErr(e?.message || 'No se pudo registrar el gasto.');
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a gastos" onClick={() => navigate('/expenses')} />
        <div>
          <h2 className={t.title}>Nuevo gasto</h2>
          <span className={s.muted}>Registra la compra o el pago con sus líneas y la foto de la factura.</span>
        </div>
      </div>

      <div className={t.grid}>
        <Card>
          <Card.Header title="Datos del gasto" />
          <Card.Body>
            <div className={s.formCol}>
              <div className={s.formGrid}>
                <DatePicker label="Fecha del gasto" icon="fas fa-calendar" max={todayIso()}
                  value={form.expense_date} onChange={(d) => set('expense_date', d)} />
                <Select label="Método de pago" icon="fas fa-wallet"
                  value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}
                  options={paymentOptions} />
              </div>
              <Autocomplete
                label="Proveedor"
                icon="fas fa-truck-field"
                placeholder="Busca el proveedor o escribe uno nuevo…"
                fetcher={(q) => api.expenseSuppliers(q)}
                value={supplier}
                onChange={setSupplier}
                minChars={2}
                creatable
                onCreate={(name) => setSupplier({ name })}
                hint={supplier && !supplier.id ? `Se creará el proveedor «${supplier.name}» al guardar.` : undefined}
              />
              <Textarea label="Nota" placeholder="Comentario general del gasto (opcional)"
                value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Fotos de la factura" />
          <Card.Body>
            <MultiImageUpload ref={photosRef} folder="expenses" visibility="private"
              hint="Opcional · JPG, PNG o WEBP · se guardan privadas y se consultan con enlace temporal" />
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header title="Líneas del gasto" />
        <Card.Body>
          <div className={t.lines}>
            {lines.map((l) => (
              <div key={l.key} className={t.line}>
                <div className={t.lineCategory}>
                  <CategoryCascader tree={tree || []} value={l.categoryId} loading={loadingTree}
                    onChange={(id) => setLine(l.key, 'categoryId', id)} />
                </div>
                <Input label="Descripción" icon="fas fa-pen" placeholder="Ej. Cloro 30 kg"
                  value={l.description} onChange={(e) => setLine(l.key, 'description', e.target.value)} />
                <MoneyInput label="Valor" icon="fas fa-dollar-sign" placeholder="0"
                  value={l.value} onChange={(v) => setLine(l.key, 'value', v)} />
                <div className={t.lineRemove}>
                  <IconButton icon="fas fa-trash" variant="light" title="Quitar línea"
                    disabled={lines.length === 1} onClick={() => removeLine(l.key)} />
                </div>
              </div>
            ))}
          </div>

          <div className={t.linesFooter}>
            <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => setLines((ls) => [...ls, newLine()])}>
              Añadir línea
            </Button>
            <div className={t.total}>
              <span>Total</span>
              <strong>{expenseMoney(total)}</strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}

      <div className={t.actions}>
        <Button variant="secondary" onClick={() => navigate('/expenses')}>Cancelar</Button>
        <Button variant="primary" icon="fas fa-check" loading={saving} disabled={!valid} onClick={submit}>
          Registrar gasto
        </Button>
      </div>
    </div>
  );
}
