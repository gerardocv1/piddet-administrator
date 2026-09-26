import React from 'react';
import Cropper from 'react-easy-crop';
import { Spinner } from '../../../components';
import { CloseIcon, MinusIcon, PlusIcon, RotateIcon } from './icons.jsx';
import { profilePhotoFile } from './profilePhoto.js';
import s from './PhotoCropper.module.css';

// Recorte de la foto de perfil a pantalla completa: el socio arrastra y pellizca (o usa la barra
// de zoom) hasta que la cara quede dentro del círculo, puede girarla si salió de lado, y la
// confirma. Lo que se sube es exactamente lo que ve en el círculo.

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function PhotoCropper({ src, onCancel, onConfirm }) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [area, setArea] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onCancel(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onCancel, saving]);

  const confirm = async () => {
    if (!area || saving) return;
    setSaving(true);
    setError('');
    try {
      const file = await profilePhotoFile(src, area, rotation);
      await onConfirm(file);
    } catch (err) {
      setError(err?.message || 'No pudimos guardar tu foto. Intenta de nuevo.');
      setSaving(false);
    }
  };

  // El círculo deja aire a los lados: pegado al borde de la pantalla no se ve qué queda fuera.
  const [cropSide] = React.useState(() => Math.max(200, Math.min(window.innerWidth - 48, 380)));

  const zoomBy = (delta) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 10) / 10)));

  return (
    <div className={s.screen} role="dialog" aria-modal="true" aria-labelledby="portal-crop-title">
      <header className={s.head}>
        <button type="button" className={s.iconBtn} onClick={onCancel} disabled={saving} aria-label="Cancelar">
          <CloseIcon size={20} />
        </button>
        <h2 id="portal-crop-title" className={s.title}>Ajusta tu foto</h2>
        <button type="button" className={s.iconBtn} onClick={() => setRotation((r) => (r + 90) % 360)} disabled={saving} aria-label="Girar">
          <RotateIcon size={20} />
        </button>
      </header>

      <div className={s.stage}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropSize={{ width: cropSide, height: cropSide }}
          cropShape="round"
          showGrid={false}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          zoomSpeed={0.4}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, px) => setArea(px)}
          classes={{ containerClassName: s.cropper, cropAreaClassName: s.cropArea }}
        />
      </div>

      <div className={s.controls}>
        <p className={s.hint}>Arrastra para mover y pellizca para acercar.</p>
        <div className={s.zoom}>
          <button type="button" className={s.zoomBtn} onClick={() => zoomBy(-0.2)} disabled={saving} aria-label="Alejar">
            <MinusIcon size={18} />
          </button>
          <input
            className={s.range}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            disabled={saving}
          />
          <button type="button" className={s.zoomBtn} onClick={() => zoomBy(0.2)} disabled={saving} aria-label="Acercar">
            <PlusIcon size={18} />
          </button>
        </div>
        {error && <p className={s.error} role="alert">{error}</p>}
        <div className={s.actions}>
          <button type="button" className={s.secondary} onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="button" className={s.primary} onClick={confirm} disabled={!area || saving}>
            {saving ? <><Spinner size="sm" /><span>Guardando…</span></> : <span>Usar foto</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
