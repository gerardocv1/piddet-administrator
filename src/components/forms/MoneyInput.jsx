import React from 'react';
import { Input } from './Input.jsx';

// Campo de moneda con formato colombiano: separador de miles "." y decimal ",". Los decimales son
// OPCIONALES: si el valor es entero no se muestran ceros de relleno (2000 → "2.000", no "2.000,0000").
//
// Contrato con el padre: trabaja con el valor CANÓNICO (string numérico tipo "5500.2", punto decimal
// y sin separadores de miles), que es lo que el backend espera. `value` acepta lo que devuelve la API
// (p. ej. "2000.0000") y `onChange` emite siempre el canónico. La presentación colombiana vive solo
// dentro de este componente.

const groupThousands = (intDigits) => intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Canónico (con punto decimal) a partir del texto colombiano: quita los puntos de miles y
// convierte la coma decimal en punto.
const toCanonical = (display) => {
  if (!display) return '';
  return display.replace(/\./g, '').replace(',', '.');
};

// Formatea lo que el usuario va tecleando, respetando una coma decimal en curso (p. ej. "5.500,").
// Los puntos se tratan SIEMPRE como separadores de miles (se reagrupan); el decimal es solo la coma.
const formatTyping = (raw, maxDecimals) => {
  const cleaned = String(raw).replace(/[^\d,]/g, '');
  const comma = cleaned.indexOf(',');
  if (comma === -1) return groupThousands(cleaned.replace(/^0+(?=\d)/, ''));
  const intPart = cleaned.slice(0, comma).replace(/,/g, '').replace(/^0+(?=\d)/, '');
  const decPart = cleaned.slice(comma + 1).replace(/,/g, '').slice(0, maxDecimals);
  return `${groupThousands(intPart) || '0'},${decPart}`;
};

// Valor canónico/numérico de la API a texto colombiano, recortando ceros decimales sobrantes.
const canonicalToDisplay = (value, maxDecimals) => {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const [int, dec = ''] = n.toFixed(maxDecimals).split('.');
  const trimmed = dec.replace(/0+$/, '');
  const grouped = groupThousands(int);
  return trimmed ? `${grouped},${trimmed}` : grouped;
};

const sameNumber = (a, b) => {
  const na = a == null || a === '' ? null : Number(a);
  const nb = b == null || b === '' ? null : Number(b);
  return na === nb;
};

export function MoneyInput({ value, onChange, decimals = 2, ...rest }) {
  const [display, setDisplay] = React.useState(() => canonicalToDisplay(value, decimals));
  const lastCanonical = React.useRef(toCanonical(display));

  // Resincroniza si el valor externo cambia por algo distinto a la propia escritura (hidratación,
  // reset del formulario). No reformatea mientras el usuario teclea: tras emitir, el padre guarda el
  // mismo canónico, así que el número coincide y no se pisa el texto en curso.
  React.useEffect(() => {
    if (sameNumber(value, lastCanonical.current)) return;
    const next = canonicalToDisplay(value, decimals);
    setDisplay(next);
    lastCanonical.current = toCanonical(next);
  }, [value, decimals]);

  const handleChange = (e) => {
    const next = formatTyping(e.target.value, decimals);
    setDisplay(next);
    const canonical = toCanonical(next);
    lastCanonical.current = canonical;
    onChange?.(canonical);
  };

  return <Input {...rest} type="text" inputMode="decimal" value={display} onChange={handleChange} />;
}
