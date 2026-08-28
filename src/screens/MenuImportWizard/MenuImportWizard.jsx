import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, IconButton, Input, MoneyInput, Textarea, Select, Badge, Spinner, Alert,
  MultiImageUpload, CategoryCascader, useToast,
} from '../../components';
import { api } from '../../lib/api.js';
import { usePolling } from '../../lib/hooks/usePolling.js';
import { useFunctionalities } from '../../lib/permissions/useFunctionalities.js';
import s from '../screens.module.css';
import t from './MenuImportWizard.module.css';

const STEPS = [
  { n: 1, label: 'Fotos' },
  { n: 2, label: 'Analizando' },
  { n: 3, label: 'Revisión' },
  { n: 4, label: 'Confirmar' },
];

// El wrapper LLM corre async con webhook + polling de respaldo: 4 s entre intentos y tope de
// ~5 minutos, tras los cuales se avisa que sigue en curso en vez de sondear indefinidamente.
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75;

let keySeq = 0;

// Convierte el resultado del agente (output schema: menu/categories[].products[]) al modelo
// editable de la revisión, con `key` estables por categoría/producto para el listado y el borrado.
function toEditableCategories(result) {
  return (result?.categories || []).map((cat) => ({
    key: ++keySeq,
    name: cat.name || '',
    position: cat.position ?? 0,
    products: (cat.products || []).map((p) => ({
      key: ++keySeq,
      name: p.name || '',
      price: p.price != null ? String(p.price) : '',
      description: p.description || '',
      description_generated: !!p.description_generated,
      item_category_id: p.item_category_id != null ? String(p.item_category_id) : '',
      confidence: p.confidence,
      needs_review: !!p.needs_review,
    })),
  }));
}

// Asistente "Crear carta desde fotos con IA" (/menus/import[/:importId]). El agente no escribe
// nada: sube fotos, un job asíncrono las procesa y el panel muestra el resultado para que el
// usuario lo revise y edite antes de confirmar (que sí crea items + menú en el backend).
export function MenuImportWizard() {
  const navigate = useNavigate();
  const { importId: urlImportId } = useParams();
  const { toast } = useToast();
  const { has } = useFunctionalities();
  const taxesOn = has('functionality_taxes');
  const photosRef = React.useRef(null);

  const [step, setStep] = React.useState(1);
  const [bootLoading, setBootLoading] = React.useState(!!urlImportId);
  const [importId, setImportId] = React.useState(urlImportId ? Number(urlImportId) : null);
  const [failure, setFailure] = React.useState(null); // { reason } cuando el agente no pudo procesar

  const [menuName, setMenuName] = React.useState('');
  const [agentMenuName, setAgentMenuName] = React.useState(null);
  const [photoCount, setPhotoCount] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  const [categories, setCategories] = React.useState([]);
  const [warnings, setWarnings] = React.useState([]);
  const [defaultTaxId, setDefaultTaxId] = React.useState('');
  const [taxes, setTaxes] = React.useState([]);
  const [tree, setTree] = React.useState([]);
  const [loadingTree, setLoadingTree] = React.useState(false);

  const [confirming, setConfirming] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState(null);

  // Árbol de categorías de producto (para el CategoryCascader de cada producto) e impuestos, si
  // la compañía tiene contratada la funcionalidad.
  React.useEffect(() => {
    setLoadingTree(true);
    api.itemCategoriesTree()
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => setTree([]))
      .finally(() => setLoadingTree(false));
  }, []);
  React.useEffect(() => {
    if (!taxesOn) return;
    api.taxes().then((d) => setTaxes(Array.isArray(d) ? d : [])).catch(() => {});
  }, [taxesOn]);

  const applyResult = (result) => {
    setCategories(toEditableCategories(result));
    setWarnings(result?.warnings || []);
    setAgentMenuName(result?.menu?.name || null);
  };

  // Al entrar por URL con un id (retomar una importación en curso, ya lista o fallida), resuelve
  // su estado actual antes de decidir en qué paso arrancar.
  React.useEffect(() => {
    if (!urlImportId) return;
    let alive = true;
    api.menuImport(urlImportId)
      .then((detail) => {
        if (!alive || !detail) return;
        setMenuName(detail.menu_name || '');
        if (detail.status === 'completed') {
          applyResult(detail.result);
          setStep(3);
        } else if (detail.status === 'failed') {
          setFailure({ reason: detail.failure_reason || 'El agente no pudo procesar las fotos.' });
          setStep(2);
        } else if (detail.status === 'confirmed' && detail.created_menu_id) {
          navigate(`/menus/${detail.created_menu_id}`, { replace: true });
        } else {
          setStep(2); // pending/running: continúa el polling normal
        }
      })
      .catch(() => { if (alive) { setFailure({ reason: 'No se pudo cargar la importación.' }); setStep(2); } })
      .finally(() => { if (alive) setBootLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlImportId]);

  // ---- Paso 1: nombre + fotos → sube las fotos y crea la importación ----
  const submitPhotos = async () => {
    if (creating || !menuName.trim() || photoCount === 0) return;
    setCreating(true);
    setCreateError(null);
    try {
      const fileNames = await photosRef.current?.uploadAll() ?? [];
      const created = await api.createMenuImport({ fileNames, menuName: menuName.trim() });
      setImportId(created.id);
      navigate(`/menus/import/${created.id}`, { replace: true });
      setStep(2);
    } catch (e) {
      setCreateError(e?.message || 'No se pudo iniciar la importación.');
    } finally {
      setCreating(false);
    }
  };

  // ---- Paso 2: sondeo de estado (se apaga solo mientras hay un fallo pendiente de reintento) ----
  const statusFetcher = React.useCallback(() => api.menuImportStatus(importId), [importId]);
  const { data: statusData, timedOut } = usePolling(statusFetcher, {
    intervalMs: POLL_INTERVAL_MS,
    maxAttempts: MAX_POLL_ATTEMPTS,
    stopWhen: (r) => r?.status === 'completed' || r?.status === 'failed',
    enabled: step === 2 && !!importId && !failure,
  });

  React.useEffect(() => {
    if (!statusData || !importId) return;
    if (statusData.status === 'completed') {
      api.menuImport(importId)
        .then((detail) => { applyResult(detail.result); setStep(3); })
        .catch(() => setFailure({ reason: 'No se pudo cargar el resultado del agente.' }));
    } else if (statusData.status === 'failed') {
      setFailure({ reason: statusData.failure_reason || 'El agente no pudo procesar las fotos.' });
    }
  }, [statusData, importId]);

  const retryAnalysis = async () => {
    if (!importId) return;
    try { await api.retryMenuImport(importId); setFailure(null); }
    catch (e) { setFailure({ reason: e?.message || 'No se pudo reintentar.' }); }
  };

  const cancelImport = async () => {
    if (importId) { try { await api.cancelMenuImport(importId); } catch { /* se cancela igual del lado del panel */ } }
    navigate('/menus');
  };

  const copyResumeUrl = () => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); };

  // ---- Paso 3: revisión editable ----
  const renameCategory = (catKey, name) =>
    setCategories((prev) => prev.map((c) => (c.key === catKey ? { ...c, name } : c)));
  const updateProduct = (catKey, prodKey, patch) =>
    setCategories((prev) => prev.map((c) => (c.key !== catKey ? c : { ...c, products: c.products.map((p) => (p.key === prodKey ? { ...p, ...patch } : p)) })));
  const removeProduct = (catKey, prodKey) =>
    setCategories((prev) => prev.map((c) => (c.key !== catKey ? c : { ...c, products: c.products.filter((p) => p.key !== prodKey) })));

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);
  const usableCategories = categories.filter((c) => c.products.length > 0);

  // ---- Paso 4: confirmar ----
  const submitConfirm = async () => {
    if (confirming || !importId) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const payload = {
        menu_name: menuName.trim(),
        categories: usableCategories.map((c) => ({
          name: c.name.trim(),
          position: c.position,
          products: c.products.map((p) => ({
            name: p.name.trim(),
            price: p.price === '' ? null : Number(p.price),
            description: p.description.trim(),
            item_category_id: p.item_category_id ? Number(p.item_category_id) : null,
            ...(taxesOn && defaultTaxId ? { tax_family_id: Number(defaultTaxId) } : {}),
          })),
        })),
      };
      const { created_menu_id } = await api.confirmMenuImport(importId, payload);
      toast({ tone: 'success', title: 'Carta creada desde las fotos' });
      navigate(`/menus/${created_menu_id}`);
    } catch (e) {
      setConfirmError(e?.message || 'No se pudo confirmar la importación.');
    } finally {
      setConfirming(false);
    }
  };

  if (bootLoading) {
    return <div className={t.wizard}><Spinner center label="Cargando la importación…" /></div>;
  }

  const taxLabel = taxes.find((tx) => String(tx.id) === defaultTaxId)?.name;

  return (
    <div className={t.wizard}>
      <ol className={t.stepper}>
        {STEPS.map((st) => (
          <li key={st.n}
            className={[t.step, step === st.n ? t.stepActive : '', step > st.n ? t.stepDone : ''].filter(Boolean).join(' ')}>
            <span className={t.stepDot}>{step > st.n ? <i className="fas fa-check" /> : st.n}</span>
            <span className={t.stepLabel}>{st.label}</span>
          </li>
        ))}
      </ol>

      <div className={t.body}>
        {/* ---------- Paso 1: nombre + fotos ---------- */}
        {step === 1 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Sube las fotos de tu carta</h3>
            <p className={t.intro}>
              La IA identifica productos, precios, descripciones y categorías a partir de las
              fotos. Vas a poder revisar y editar todo antes de crear la carta.
            </p>
            <Input label="Nombre de la carta" icon="fas fa-book-open" placeholder="Ej. Carta principal"
              value={menuName} onChange={(e) => setMenuName(e.target.value)} />
            <MultiImageUpload ref={photosRef} folder="menus" visibility="private" max={8}
              onChange={setPhotoCount}
              hint="Hasta 8 fotos · una página de la carta por foto, con buena luz y sin reflejos" />
            {createError && <Alert tone="danger" onClose={() => setCreateError(null)}>{createError}</Alert>}
          </div>
        )}

        {/* ---------- Paso 2: análisis (loading + polling) ---------- */}
        {step === 2 && (
          <div className={t.loading}>
            {failure ? (
              <div className={t.stateBox}>
                <span className={`${t.stateIcon} ${t.stateIconDanger}`}><i className="fas fa-triangle-exclamation" /></span>
                <h3 className={t.heading}>No se pudo generar la carta</h3>
                <p className={t.stateText}>{failure.reason}</p>
                <div className={t.stateActions}>
                  <Button variant="secondary" onClick={cancelImport}>Cancelar</Button>
                  <Button variant="primary" icon="fas fa-rotate-right" onClick={retryAnalysis}>Reintentar</Button>
                </div>
              </div>
            ) : timedOut ? (
              <div className={t.stateBox}>
                <span className={t.stateIcon}><i className="fas fa-robot" /></span>
                <h3 className={t.heading}>Sigue procesando</h3>
                <p className={t.stateText}>
                  El agente está tardando más de lo esperado. Puedes cerrar esta pantalla y volver
                  más tarde con este enlace: la importación sigue trabajando en segundo plano.
                </p>
                <div className={t.resumeUrl}>
                  <code>{window.location.href}</code>
                  <IconButton icon="fas fa-copy" size="sm" title="Copiar enlace" onClick={copyResumeUrl} />
                </div>
                <Button variant="secondary" onClick={() => navigate('/menus')}>Volver a menús</Button>
              </div>
            ) : (
              <div className={t.stateBox}>
                <span className={`${t.stateIcon} ${t.aiPulse}`}><i className="fas fa-wand-magic-sparkles" /></span>
                <h3 className={t.heading}>La IA está analizando tu carta…</h3>
                <p className={t.stateText}>
                  Estamos leyendo las fotos e identificando productos, precios y categorías. Puede
                  tardar uno o dos minutos.
                </p>
                <button type="button" className={t.cancelLink} onClick={cancelImport}>Cancelar importación</button>
              </div>
            )}
          </div>
        )}

        {/* ---------- Paso 3: revisión editable ---------- */}
        {step === 3 && (
          <div className={t.review}>
            <h3 className={t.heading}>Revisa lo que encontró la IA</h3>
            <p className={t.intro}>
              Edita nombres, precios, descripciones y categorías antes de continuar. Los productos
              marcados <Badge variant="warning">Revisar</Badge> tuvieron baja confianza del agente.
            </p>

            {warnings.length > 0 && (
              <Alert tone="warning" title="Avisos del agente">
                <ul className={t.warningsList}>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </Alert>
            )}

            <Input label="Nombre de la carta" icon="fas fa-book-open" value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              hint={agentMenuName && agentMenuName !== menuName ? `La IA detectó: "${agentMenuName}"` : undefined} />

            {taxesOn && (
              <Select label="Impuesto para todos los productos" icon="fas fa-percent"
                value={defaultTaxId} onChange={(e) => setDefaultTaxId(e.target.value)}
                options={[{ value: '', label: 'Sin impuesto' }, ...taxes.map((tx) => ({ value: String(tx.id), label: tx.name }))]} />
            )}

            {categories.map((cat) => (
              <div key={cat.key} className={t.categoryBlock}>
                <Input className={t.categoryNameInput} value={cat.name} placeholder="Nombre de la categoría"
                  onChange={(e) => renameCategory(cat.key, e.target.value)} />
                {cat.products.length === 0 ? (
                  <p className={t.emptyCategory}>Sin productos: esta categoría no se creará.</p>
                ) : cat.products.map((prod) => (
                  <div key={prod.key} className={t.productCard}>
                    <div className={t.productTop}>
                      <div className={t.productBadges}>
                        {prod.needs_review && (
                          <Badge variant="warning"><i className="fas fa-triangle-exclamation" /> Revisar</Badge>
                        )}
                        {prod.description_generated && (
                          <Badge variant="info"><i className="fas fa-sparkles" /> Descripción generada</Badge>
                        )}
                      </div>
                      <button type="button" className={t.productRemove}
                        onClick={() => removeProduct(cat.key, prod.key)} aria-label="Quitar producto">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                    <div className={s.formGrid}>
                      <Input label="Nombre" value={prod.name}
                        onChange={(e) => updateProduct(cat.key, prod.key, { name: e.target.value })} />
                      <MoneyInput label="Precio" placeholder="0" value={prod.price}
                        onChange={(v) => updateProduct(cat.key, prod.key, { price: v })} />
                    </div>
                    <Textarea label="Descripción" value={prod.description}
                      onChange={(e) => updateProduct(cat.key, prod.key, { description: e.target.value })} />
                    <CategoryCascader tree={tree} loading={loadingTree} value={prod.item_category_id}
                      onChange={(id) => updateProduct(cat.key, prod.key, { item_category_id: id })} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ---------- Paso 4: confirmar ---------- */}
        {step === 4 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Confirma la creación</h3>
            <div className={t.summaryCard}>
              <div><span>Carta</span><strong>{menuName}</strong></div>
              <div><span>Categorías</span><strong>{usableCategories.length}</strong></div>
              <div><span>Productos</span><strong>{totalProducts}</strong></div>
              {taxesOn && <div><span>Impuesto</span><strong>{taxLabel || 'Sin impuesto'}</strong></div>}
            </div>
            <p className={t.intro}>
              Se crearán los productos en tu catálogo y la carta con sus categorías propias. Podrás
              seguir editando todo después, desde el detalle de la carta.
            </p>
            {confirmError && <Alert tone="danger" onClose={() => setConfirmError(null)}>{confirmError}</Alert>}
          </div>
        )}
      </div>

      {/* Barra de acciones sticky (el paso 2 gestiona sus propios botones dentro del contenido) */}
      {step !== 2 && (
        <div className={t.actionBar}>
          {step === 1 && (
            <>
              <Button variant="secondary" onClick={() => navigate('/menus')} disabled={creating}>Cancelar</Button>
              <Button variant="primary" icon="fas fa-wand-magic-sparkles" loading={creating}
                disabled={!menuName.trim() || photoCount === 0} onClick={submitPhotos}>
                Analizar con IA
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="secondary" onClick={() => navigate('/menus')}>Cancelar</Button>
              <Button variant="primary" icon="fas fa-arrow-right" disabled={totalProducts === 0 || usableCategories.length === 0}
                onClick={() => setStep(4)}>
                Continuar
              </Button>
            </>
          )}
          {step === 4 && (
            <>
              <Button variant="secondary" onClick={() => setStep(3)} disabled={confirming}>Atrás</Button>
              <Button variant="primary" icon="fas fa-check" loading={confirming} onClick={submitConfirm}>
                Confirmar y crear
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
