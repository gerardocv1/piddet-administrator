import React from 'react';
import { Modal } from '../feedback/Modal.jsx';
import { Button } from '../core/Button.jsx';
import { Spinner } from '../core/Spinner.jsx';
import {
  MANUAL_ERASE, MANUAL_KEEP,
  buildAlphaMask, composite, detectBackgroundColor, loadWorkImage,
  paintDisc, paintStroke, pickColorAt, toPngBlob, trimTransparent,
} from '../../lib/removeBackground.js';
import s from './BackgroundRemover.module.css';

/**
 * Editor para dejar un logo sin fondo.
 *
 * El fondo se quita por color (se detecta solo, o se elige con el cuentagotas) y se afina con
 * tolerancia y borde suave; lo que el color no acierte se corrige a mano con los pinceles de
 * borrar y restaurar. El resultado sale siempre como PNG con transparencia.
 *
 * Props:
 *  - src: object URL de la imagen a editar
 *  - onApply(blob): PNG resultante
 *  - onCancel()
 */
const HISTORY_LIMIT = 12;
const TOOLS = [
  { key: 'pick', label: 'Cuentagotas', icon: 'fas fa-eye-dropper', title: 'Elegir el color del fondo' },
  { key: 'erase', label: 'Borrar', icon: 'fas fa-eraser', title: 'Borrar a mano lo que sobre' },
  { key: 'keep', label: 'Restaurar', icon: 'fas fa-paintbrush', title: 'Devolver lo que se borró de más' },
];

export function BackgroundRemover({ src, onApply, onCancel }) {
  const canvasRef = React.useRef(null);
  const baseRef = React.useRef(null);   // ImageData original (a tamaño de trabajo)
  const manualRef = React.useRef(null); // retoques con pincel, un byte por píxel
  const alphaRef = React.useRef(null);  // opacidad calculada por color
  const historyRef = React.useRef([]);
  const strokeRef = React.useRef(null);
  const frameRef = React.useRef(0);

  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tool, setTool] = React.useState('pick');
  const [color, setColor] = React.useState([255, 255, 255]);
  const [seeds, setSeeds] = React.useState([]);
  const [tolerance, setTolerance] = React.useState(22);
  const [softness, setSoftness] = React.useState(10);
  const [brush, setBrush] = React.useState(28);
  const [contiguous, setContiguous] = React.useState(true);
  const [despill, setDespill] = React.useState(true);
  const [trim, setTrim] = React.useState(true);
  const [strokes, setStrokes] = React.useState(0);
  const [showOriginal, setShowOriginal] = React.useState(false);

  const paint = React.useCallback(() => {
    const base = baseRef.current;
    const canvas = canvasRef.current;
    if (!base || !canvas || !alphaRef.current) return;
    const result = showOriginal
      ? base
      : composite(base, alphaRef.current, manualRef.current, { despill, color });
    canvas.getContext('2d').putImageData(result, 0, 0);
  }, [color, despill, showOriginal]);

  const recompute = React.useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    alphaRef.current = buildAlphaMask(base, { color, tolerance, softness, contiguous, seeds });
    paint();
  }, [color, tolerance, softness, contiguous, seeds, paint]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadWorkImage(src)
      .then((imageData) => {
        if (!alive) return;
        baseRef.current = imageData;
        manualRef.current = new Uint8Array(imageData.width * imageData.height);
        historyRef.current = [];
        const canvas = canvasRef.current;
        if (canvas) { canvas.width = imageData.width; canvas.height = imageData.height; }
        setColor(detectBackgroundColor(imageData));
        setLoading(false);
      })
      .catch(() => { if (alive) { setError('No se pudo abrir la imagen.'); setLoading(false); } });
    return () => { alive = false; };
  }, [src]);

  // Un recálculo por frame: arrastrar un slider no encadena pasadas completas sobre la imagen.
  React.useEffect(() => {
    if (loading) return undefined;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(frameRef.current);
  }, [loading, recompute, strokes]);

  const pointerToImage = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const brushRadius = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return (brush / 2) * (canvas.width / rect.width);
  };

  const pushHistory = () => {
    historyRef.current.push(manualRef.current.slice());
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
  };

  const onPointerDown = (e) => {
    if (loading || showOriginal) return;
    const point = pointerToImage(e);

    if (tool === 'pick') {
      setColor(pickColorAt(baseRef.current, point.x, point.y));
      setSeeds([point]);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    strokeRef.current = point;
    paintDisc(manualRef.current, baseRef.current.width, baseRef.current.height,
      point.x, point.y, brushRadius(), tool === 'erase' ? MANUAL_ERASE : MANUAL_KEEP);
    paint();
  };

  const onPointerMove = (e) => {
    if (!strokeRef.current) return;
    const point = pointerToImage(e);
    paintStroke(manualRef.current, baseRef.current.width, baseRef.current.height,
      strokeRef.current, point, brushRadius(), tool === 'erase' ? MANUAL_ERASE : MANUAL_KEEP);
    strokeRef.current = point;
    paint();
  };

  const endStroke = () => {
    if (!strokeRef.current) return;
    strokeRef.current = null;
    setStrokes((n) => n + 1);
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    manualRef.current = previous;
    setStrokes((n) => n + 1);
  };

  const resetAll = () => {
    if (!baseRef.current) return;
    historyRef.current = [];
    manualRef.current = new Uint8Array(baseRef.current.width * baseRef.current.height);
    setSeeds([]);
    setTolerance(22);
    setSoftness(10);
    setColor(detectBackgroundColor(baseRef.current));
    setStrokes((n) => n + 1);
  };

  const apply = async () => {
    setApplying(true);
    try {
      let result = composite(baseRef.current, alphaRef.current, manualRef.current, { despill, color });
      if (trim) result = trimTransparent(result, 2);
      onApply(await toPngBlob(result));
    } catch (e) {
      setError('No se pudo generar la imagen sin fondo.');
      setApplying(false);
    }
  };

  const swatch = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  const painting = tool !== 'pick';

  return (
    <Modal
      open
      title="Quitar el fondo"
      subtitle="El resultado se guarda en PNG, con transparencia"
      size="lg"
      width={760}
      onClose={onCancel}
      footer={<>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" loading={applying} disabled={loading} onClick={apply}>Aplicar</Button>
      </>}
    >
      <div className={s.root}>
        <div className={s.tools}>
          {TOOLS.map((t) => (
            <button key={t.key} type="button" className={s.tool} data-active={tool === t.key}
              title={t.title} onClick={() => setTool(t.key)}>
              <i className={t.icon} aria-hidden="true" /> {t.label}
            </button>
          ))}
          <span className={s.swatch} title="Color de fondo detectado">
            <span style={{ background: swatch }} />
          </span>
          <div className={s.spacer} />
          <button type="button" className={s.tool} onClick={undo} disabled={!historyRef.current.length}
            title="Deshacer la última pincelada">
            <i className="fas fa-rotate-left" aria-hidden="true" />
          </button>
          <button type="button" className={s.tool} onClick={resetAll} title="Empezar de nuevo">
            <i className="fas fa-arrows-rotate" aria-hidden="true" />
          </button>
          <button type="button" className={s.tool} data-active={showOriginal}
            onClick={() => setShowOriginal((v) => !v)} title="Ver la imagen original">
            <i className="fas fa-eye" aria-hidden="true" />
          </button>
        </div>

        <div className={s.stage}>
          {loading && <div className={s.loading}><Spinner /></div>}
          <canvas
            ref={canvasRef}
            className={s.canvas}
            data-tool={tool}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
          />
        </div>

        <div className={s.sliders}>
          <label className={s.slider}>
            <span>Tolerancia</span>
            <input type="range" min={0} max={100} value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))} />
            <b>{tolerance}</b>
          </label>
          <label className={s.slider}>
            <span>Borde suave</span>
            <input type="range" min={0} max={60} value={softness}
              onChange={(e) => setSoftness(Number(e.target.value))} />
            <b>{softness}</b>
          </label>
          {painting && (
            <label className={s.slider}>
              <span>Pincel</span>
              <input type="range" min={6} max={120} value={brush}
                onChange={(e) => setBrush(Number(e.target.value))} />
              <b>{brush}</b>
            </label>
          )}
        </div>

        <div className={s.checks}>
          <label><input type="checkbox" checked={contiguous} onChange={(e) => setContiguous(e.target.checked)} />
            Solo el fondo de alrededor</label>
          <label><input type="checkbox" checked={despill} onChange={(e) => setDespill(e.target.checked)} />
            Quitar el halo del borde</label>
          <label><input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            Ajustar al contenido</label>
        </div>

        <p className={s.hint}>
          {tool === 'pick'
            ? 'Toca el fondo para elegir el color que se quita y sube la tolerancia hasta que desaparezca.'
            : 'Arrastra sobre la imagen para corregir a mano lo que el color no acertó.'}
        </p>
        {error && <div className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
      </div>
    </Modal>
  );
}
