import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Spinner } from '../core/Spinner.jsx';
import styles from './SalesComparisonChart.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const fmtDayMonth = (iso) => {
  const [, m, d] = String(iso).split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1] || ''}`;
};

// Rotación de acentos del tema para diferenciar series (mismo criterio que SalesByTypeChart):
// respeta tema claro/oscuro porque son variables CSS, no colores fijos.
const ACCENT_VARS = ['--color-primary', '--color-accent', '--color-success', '--color-info', '--color-warning', '--color-danger'];

function readColors() {
  const cs = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const v = (name, fb) => (cs && cs.getPropertyValue(name).trim()) || fb;
  return {
    accents: ACCENT_VARS.map((name, i) => v(name, ['#4f7cff', '#0ea5a3', '#2dce89', '#11cdef', '#fb6340', '#f5365c'][i])),
    surface: v('--surface-card', '#ffffff'),
    grid: v('--border-color', '#eceff3'),
    tick: v('--gray-500', '#6b7280'),
  };
}

const SIDE_LABEL = { L: 'izq.', R: 'der.' };

// Arma las líneas a graficar a partir de las series del progreso: una por (tipo, lado) si el tipo
// admite lado (bíceps, muslo…), una sola si no. Las fechas del eje X son la unión de todas las
// fechas con dato, para que huecos de una serie no desalineen a las demás (spanGaps las salta).
function buildLines(series, selectedKeys) {
  const lines = [];
  selectedKeys.forEach((key) => {
    const s = series[key];
    if (!s || !s.points?.length) return;
    const sides = new Set(s.points.map((p) => p.side || null));
    if (sides.size === 1 && sides.has(null)) {
      lines.push({ key, side: null, points: s.points, unit: s.unit });
    } else {
      ['L', 'R'].forEach((side) => {
        if (sides.has(side)) lines.push({ key, side, points: s.points.filter((p) => p.side === side), unit: s.unit });
      });
    }
  });
  return lines;
}

/**
 * Gráfica de progreso de medidas físicas de un miembro. `series`: payload de
 * api.gymMemberProgress ({ [type_key]: { unit, points: [{date, value, side}] } }).
 * `selectedKeys`: tipos a graficar. `labelFor(key)`: nombre legible del tipo.
 */
export function BodyMeasuresChart({ series, selectedKeys = [], labelFor, loading = false, loadingLabel = 'Cargando progreso…', emptyLabel = 'Sin mediciones para las medidas seleccionadas.' }) {
  if (loading) {
    return <div className={styles.wrap}><Spinner center label={loadingLabel} /></div>;
  }

  const lines = buildLines(series || {}, selectedKeys);
  if (!lines.length) {
    return <div className={styles.empty}>{emptyLabel}</div>;
  }

  const allDates = Array.from(new Set(lines.flatMap((l) => l.points.map((p) => p.date)))).sort();
  const c = readColors();
  const point = { pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: c.surface, pointBorderWidth: 2 };

  const units = new Set(lines.map((l) => l.unit));
  const singleUnit = units.size === 1 ? [...units][0] : null;

  const chartData = {
    labels: allDates.map(fmtDayMonth),
    datasets: lines.map((line, i) => {
      const byDate = Object.fromEntries(line.points.map((p) => [p.date, Number(p.value)]));
      const color = c.accents[i % c.accents.length];
      const label = (labelFor ? labelFor(line.key) : line.key) + (line.side ? ` (${SIDE_LABEL[line.side]})` : '');
      return {
        label,
        data: allDates.map((d) => (d in byDate ? byDate[d] : null)),
        spanGaps: true,
        borderColor: color,
        backgroundColor: 'transparent',
        pointBorderColor: color,
        fill: false,
        tension: 0.35,
        borderWidth: 2.5,
        ...point,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 22, boxHeight: 12, padding: 18, color: c.tick, font: { size: 13 } },
      },
      tooltip: {
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => {
            const unit = lines[ctx.datasetIndex]?.unit || '';
            return ` ${ctx.dataset.label}: ${ctx.parsed.y ?? '—'} ${unit}`;
          },
        },
      },
    },
    scales: {
      y: {
        border: { display: false },
        grid: { color: c.grid, drawTicks: false },
        ticks: { color: c.tick, padding: 8, font: { size: 12 }, callback: (val) => (singleUnit ? `${val} ${singleUnit}` : val) },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: c.tick, font: { size: 12 } },
      },
    },
  };

  return (
    <div className={styles.wrap}>
      <Line data={chartData} options={options} />
    </div>
  );
}
