import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Modal } from './Modal.jsx';
import { Button } from '../core/Button.jsx';
import { Input } from '../forms/Input.jsx';
import { Spinner } from '../core/Spinner.jsx';
import styles from './MapPickerModal.module.css';

// Leaflet resuelve sus iconos por ruta relativa, que el bundler rompe; se reasignan a los assets
// empaquetados por Vite para que el marcador se vea.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [6.2442, -75.5812]; // Medellín, como punto de partida neutro.

// Intenta leer coordenadas de un texto: "6.24,-75.58" o un enlace de Google Maps (@lat,lng /
// q=lat,lng / !3dlat!4dlng). Devuelve [lat, lng] o null si no encuentra coordenadas válidas.
function parseLatLng(text = '') {
  const t = text.trim();
  const patterns = [
    /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/, // "lat,lng"
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,        // .../@lat,lng,z...
    /[?&]q=(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,   // ...?q=lat,lng
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,    // ...!3dlat!4dlng
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const la = Number(m[1]);
      const ln = Number(m[2]);
      if (Math.abs(la) <= 90 && Math.abs(ln) <= 180) return [la, ln];
    }
  }
  return null;
}

// Recentra el mapa cuando la posición cambia por búsqueda (no por click, que ya mueve el mapa).
function Recenter({ position }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15));
  }, [position?.[0], position?.[1]]);
  return null;
}

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) { onPick([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

// Dentro de un modal el contenedor mide 0 al inicializarse, así que Leaflet pinta tiles grises.
// Tras montar (y al cambiar el tamaño del modal) recalculamos el tamaño para que cargue completo.
function FixSize() {
  const map = useMap();
  React.useEffect(() => {
    const fix = () => map.invalidateSize();
    const id = setTimeout(fix, 200);
    window.addEventListener('resize', fix);
    return () => { clearTimeout(id); window.removeEventListener('resize', fix); };
  }, [map]);
  return null;
}

export function MapPickerModal({ open, lat, lng, onClose, onSelect }) {
  const initial = (lat != null && lng != null) ? [Number(lat), Number(lng)] : null;
  const [position, setPosition] = React.useState(initial);
  const [address, setAddress] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPosition((lat != null && lng != null) ? [Number(lat), Number(lng)] : null);
      setAddress('');
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Si pegan coordenadas o un enlace de Google Maps, fijamos el punto sin geocodificar.
    const coords = parseLatLng(q);
    if (coords) {
      setPosition(coords);
      setAddress('');
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, {
        headers: { 'Accept-Language': 'es' },
      });
      setResults(res.ok ? await res.json() : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r) => {
    setPosition([Number(r.lat), Number(r.lon)]);
    setAddress(r.display_name || '');
    setResults([]);
  };

  const pickPoint = (pos) => {
    setPosition(pos);
    setAddress('');
  };

  const confirm = () => {
    if (!position) return;
    onSelect({ lat: position[0], lng: position[1], address: address || null });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ubicar tienda en el mapa"
      subtitle="Busca la dirección o toca el mapa para fijar el punto."
      width={680}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-location-dot" onClick={confirm} disabled={!position}>
            Usar esta ubicación
          </Button>
        </>
      )}
    >
      <form onSubmit={search} className={styles.searchRow}>
        <Input
          icon="fas fa-magnifying-glass"
          placeholder="Dirección, o pega coordenadas / enlace de Google Maps…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapClassName={styles.searchInput}
        />
        <Button type="submit" variant="secondary" disabled={searching}>
          {searching ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" className={styles.resultItem} onClick={() => pickResult(r)}>
                <i className="fas fa-location-dot" />
                <span>{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.mapWrap}>
        {searching && <div className={styles.mapLoading}><Spinner /></div>}
        <MapContainer center={position || DEFAULT_CENTER} zoom={position ? 15 : 12} className={styles.map} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FixSize />
          <ClickCapture onPick={pickPoint} />
          <Recenter position={position} />
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{ dragend: (e) => pickPoint([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
            />
          )}
        </MapContainer>
      </div>

      <div className={styles.coords}>
        {position
          ? <span><i className="fas fa-map-pin" /> {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
          : <span className={styles.coordsHint}>Aún no has fijado un punto.</span>}
      </div>
    </Modal>
  );
}
