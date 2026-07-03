import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, IconButton, Spinner, Modal, MultiImageUpload } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { expenseMoney } from '../lib/expenseLabels.js';
import s from './screens.module.css';
import t from './ExpenseDetail.module.css';

// Detalle de un gasto: líneas con su categoría, fotos de la factura (privadas, con URL firmada
// temporal), proveedor, nota y auditoría (quién registró / quién anuló). Las líneas no se
// editan; las FOTOS sí mientras el gasto esté activo (agregar con rotación / quitar, que
// también borra de S3). La otra acción es anular (permiso expense-annul), irreversible.
export function ExpenseDetail() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = usePermissions();

  const fetcher = React.useCallback(() => api.expense(expenseId), [expenseId]);
  const { data, setData, loading, error, reload } = useResource(fetcher, null, [expenseId]);

  const [confirming, setConfirming] = React.useState(false);
  const [annulling, setAnnulling] = React.useState(false);
  const [annulError, setAnnulError] = React.useState(null);

  // Edición de fotos (solo gastos activos): agregar nuevas (con rotación) y quitar existentes.
  const newPhotosRef = React.useRef(null);
  const [photoCount, setPhotoCount] = React.useState(0);
  const [uploadKey, setUploadKey] = React.useState(0); // remonta MultiImageUpload tras guardar
  const [delPhoto, setDelPhoto] = React.useState(null); // name de la foto a quitar (pide confirmación)
  const [savingPhotos, setSavingPhotos] = React.useState(false);
  const [photoError, setPhotoError] = React.useState(null);
  const [viewerIndex, setViewerIndex] = React.useState(null); // foto abierta a pantalla completa

  const savePhotos = async () => {
    if (savingPhotos) return;
    setSavingPhotos(true);
    setPhotoError(null);
    try {
      const names = await newPhotosRef.current?.uploadAll() ?? [];
      if (names.length) setData(await api.attachExpenseFiles(expenseId, names));
      setPhotoCount(0);
      setUploadKey((k) => k + 1);
    } catch (e) {
      setPhotoError(e?.message || 'No se pudieron guardar las fotos.');
    } finally {
      setSavingPhotos(false);
    }
  };

  const removePhoto = async () => {
    if (savingPhotos) return;
    setSavingPhotos(true);
    setPhotoError(null);
    try {
      setData(await api.detachExpenseFile(expenseId, delPhoto));
      setDelPhoto(null);
    } catch (e) {
      setPhotoError(e?.message || 'No se pudo eliminar la foto.');
    } finally {
      setSavingPhotos(false);
    }
  };

  // Conserva la consulta del listado (?date_from=&date_to=&page=) al volver.
  const goBack = () => navigate(`/expenses${params.toString() ? `?${params.toString()}` : ''}`);

  const annul = async () => {
    setAnnulling(true);
    setAnnulError(null);
    try {
      await api.annulExpense(expenseId);
      setConfirming(false);
      reload();
    } catch (e) {
      setAnnulError(e?.message || 'No se pudo anular el gasto.');
    } finally {
      setAnnulling(false);
    }
  };

  if (loading) return <Spinner center label="Cargando gasto…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <div className={s.stateError}>
          <i className="fas fa-triangle-exclamation" /> {error || 'No se encontró el gasto.'}
        </div>
      </div>
    );
  }

  const active = Number(data.status) === 1;
  const items = data.items || [];
  const files = (data.files || []).filter((f) => f.url);

  // Fichas de las fotos ya guardadas. En gastos activos se pasan como `leading` del
  // MultiImageUpload para que fotos + pendientes + "Añadir foto" fluyan en UNA sola grilla.
  const photoTiles = files.map((f, i) => (
    <div key={f.name} className={t.photoWrap}>
      <button type="button" className={t.photo} title="Ver a pantalla completa"
        onClick={() => setViewerIndex(i)}>
        <img src={f.thumbnail_url || f.url} alt={`Foto de la factura ${i + 1}`} />
        <span className={t.photoZoom}><i className="fas fa-expand" /></span>
      </button>
      {active && (
        <button type="button" className={t.photoRemove} onClick={() => setDelPhoto(f.name)}
          aria-label="Quitar foto" title="Quitar foto">
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  ));

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a gastos" onClick={goBack} />
        <div className={t.headText}>
          <h2 className={t.title}>Gasto #{data.id}</h2>
          <span className={s.muted}>{data.expense_date}</span>
        </div>
        <div className={t.headActions}>
          {active
            ? <Badge variant="success" dot>Activo</Badge>
            : <Badge variant="danger" dot>Anulado</Badge>}
          {active && can('expense-annul') && (
            <Button variant="danger" size="sm" icon="fas fa-ban" onClick={() => setConfirming(true)}>
              Anular
            </Button>
          )}
        </div>
      </div>

      {!active && (
        <div className={t.annulledBanner}>
          <i className="fas fa-ban" /> Gasto anulado
          {data.annulled_by_name ? <> por <strong>{data.annulled_by_name}</strong></> : null}
          {data.annulled_at ? <> el {String(data.annulled_at).slice(0, 10)}</> : null}. No se incluye en el resumen.
        </div>
      )}

      <div className={t.mainGrid}>
        <Card>
          <Card.Header title="Líneas" />
          <Card.Body>
            {items.length === 0 ? (
              <p className={s.faint}>Sin líneas.</p>
            ) : (
              <ul className={t.items}>
                {items.map((it) => (
                  <li key={it.id} className={t.item}>
                    <div className={t.itemRow}>
                      <span className={t.itemName}>{it.description}</span>
                      <span className={t.itemPrice}>{expenseMoney(it.value)}</span>
                    </div>
                    {it.category && <div className={t.itemCategory}><i className="fas fa-tag" /> {it.category.name}</div>}
                  </li>
                ))}
              </ul>
            )}
            <div className={t.totalRow}>
              <span>Total</span>
              <strong>{expenseMoney(data.total)}</strong>
            </div>
          </Card.Body>
        </Card>

        <div className={t.sideCol}>
          <Card>
            <Card.Header title="Datos del gasto" />
            <Card.Body>
              <dl className={t.meta}>
                <div>
                  <dt><i className="fas fa-truck-field" /> Proveedor</dt>
                  <dd>{data.supplier?.name || '—'}</dd>
                </div>
                <div>
                  <dt><i className="fas fa-wallet" /> Método de pago</dt>
                  <dd>{data.payment_method_name || '—'}</dd>
                </div>
                <div>
                  <dt><i className="fas fa-user" /> Registrado por</dt>
                  <dd>{data.created_by_name || '—'}</dd>
                </div>
              </dl>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Fotos de la factura" />
            <Card.Body>
              {active && files.length < 10 ? (
                /* Una sola grilla: fotos guardadas (leading) + pendientes + "Añadir foto" */
                <div className={t.photoUpload}>
                  <MultiImageUpload key={uploadKey} ref={newPhotosRef} folder="expenses" visibility="private"
                    max={10 - files.length} onChange={setPhotoCount} leading={photoTiles}
                    hint="Agrega fotos nuevas · usa ⟳ si quedaron de lado" />
                  {photoCount > 0 && (
                    <Button variant="primary" size="sm" icon="fas fa-check" loading={savingPhotos} onClick={savePhotos}>
                      Guardar foto{photoCount === 1 ? '' : 's'}
                    </Button>
                  )}
                </div>
              ) : files.length > 0 ? (
                <div className={t.photos}>{photoTiles}</div>
              ) : (
                <p className={s.faint}>Sin fotos adjuntas.</p>
              )}
              {photoError && (
                <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {photoError}</div>
              )}
            </Card.Body>
          </Card>

          {data.notes && (
            <Card>
              <Card.Header title="Nota" />
              <Card.Body>
                <p className={t.notes}>{data.notes}</p>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      <Modal open={confirming} size="sm" title="Anular gasto" onClose={() => setConfirming(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setConfirming(false)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-ban" loading={annulling} onClick={annul}>Anular</Button>
        </>}>
        ¿Seguro que deseas anular el gasto <strong>#{data.id}</strong> por <strong>{expenseMoney(data.total)}</strong>?
        Esta acción no se puede deshacer: el gasto quedará marcado como anulado y saldrá del resumen.
        {annulError && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {annulError}</div>}
      </Modal>

      <Modal open={!!delPhoto} size="sm" title="Quitar foto" onClose={() => setDelPhoto(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelPhoto(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={savingPhotos} onClick={removePhoto}>Quitar</Button>
        </>}>
        ¿Seguro que deseas quitar esta foto de la factura? Se borra definitivamente (también del
        almacenamiento) y no se puede recuperar.
      </Modal>

      {viewerIndex != null && files[viewerIndex] && (
        <PhotoViewer
          files={files}
          index={viewerIndex}
          onNavigate={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

// Visor de fotos a pantalla completa: navegación con flechas (botones y teclado), Esc para
// cerrar y enlace al original (URL firmada temporal de S3).
function PhotoViewer({ files, index, onNavigate, onClose }) {
  const prev = () => onNavigate((index - 1 + files.length) % files.length);
  const next = () => onNavigate((index + 1) % files.length);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && files.length > 1) prev();
      if (e.key === 'ArrowRight' && files.length > 1) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const photo = files[index];

  return (
    <div className={t.viewer} role="dialog" aria-modal="true" aria-label="Foto de la factura" onClick={onClose}>
      <div className={t.viewerTop} onClick={(e) => e.stopPropagation()}>
        <span className={t.viewerCount}>{index + 1} / {files.length}</span>
        <a href={photo.url} target="_blank" rel="noreferrer" className={t.viewerOriginal}>
          <i className="fas fa-up-right-from-square" /> Ver original
        </a>
        <button type="button" className={t.viewerClose} onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-times" />
        </button>
      </div>

      <img className={t.viewerImg} src={photo.url} alt={`Foto de la factura ${index + 1}`}
        onClick={(e) => e.stopPropagation()} />

      {files.length > 1 && (
        <>
          <button type="button" className={`${t.viewerNav} ${t.viewerPrev}`} aria-label="Anterior"
            onClick={(e) => { e.stopPropagation(); prev(); }}>
            <i className="fas fa-chevron-left" />
          </button>
          <button type="button" className={`${t.viewerNav} ${t.viewerNext}`} aria-label="Siguiente"
            onClick={(e) => { e.stopPropagation(); next(); }}>
            <i className="fas fa-chevron-right" />
          </button>
        </>
      )}
    </div>
  );
}
