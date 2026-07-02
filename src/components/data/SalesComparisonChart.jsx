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
const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('es-CO');
const abbr = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
};

// Los colores del gráfico salen de los tokens CSS (respeta tema claro/oscuro).
function readColors() {
  const cs = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const v = (name, fb) => (cs && cs.getPropertyValue(name).trim()) || fb;
  return {
    primary: v('--color-primary', '#4f7cff'),
    area: v('--color-primary-050', 'rgba(79, 124, 255, 0.12)'),
    muted: v('--gray-400', '#9ca3af'),
    surface: v('--surface-card', '#ffffff'),
    grid: v('--border-color', '#eceff3'),
    tick: v('--gray-500', '#6b7280'),
  };
}

/** Gráfico de líneas comparando el período actual (línea sólida + área) contra el
 *  anterior (línea punteada), alineados por día. `data`: payload de salesComparison. */
export function SalesComparisonChart({ data, loading = false }) {
  if (loading) {
    return <div className={styles.wrap}><Spinner center label="Cargando ventas…" /></div>;
  }
  if (!data || !(data.dates || []).length) {
    return <div className={styles.empty}>No hay ventas en el período seleccionado.</div>;
  }

  const c = readColors();
  const point = {
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: c.surface,
    pointBorderWidth: 2,
  };

  const chartData = {
    labels: data.dates.map(fmtDayMonth),
    datasets: [
      {
        label: data.current_period?.label || 'Período actual',
        data: data.current_period?.data || [],
        borderColor: c.primary,
        backgroundColor: c.area,
        pointBorderColor: c.primary,
        fill: 'origin',
        tension: 0.4,
        borderWidth: 2.5,
        ...point,
      },
      {
        label: data.previous_period?.label || 'Período anterior',
        data: data.previous_period?.data || [],
        borderColor: c.muted,
        backgroundColor: 'transparent',
        pointBorderColor: c.muted,
        fill: false,
        borderDash: [6, 6],
        tension: 0.4,
        borderWidth: 2,
        ...point,
      },
    ],
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
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${money(ctx.parsed.y)}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: c.grid, drawTicks: false },
        ticks: { color: c.tick, padding: 8, font: { size: 12 }, callback: (val) => abbr(val) },
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
