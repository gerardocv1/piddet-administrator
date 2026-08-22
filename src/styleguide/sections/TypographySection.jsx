import React from 'react';
import { Section, Specimen, Code } from '../Specimen.jsx';
import styles from './sections.module.css';

const SCALE = [
  { token: '--text-3xl', label: '2.75rem' },
  { token: '--text-2xl', label: '2rem' },
  { token: '--text-xl', label: '1.625rem' },
  { token: '--text-lg', label: '1.25rem' },
  { token: '--text-md', label: '1rem' },
  { token: '--text-base', label: '0.875rem' },
  { token: '--text-sm', label: '0.8125rem' },
  { token: '--text-xs', label: '0.75rem' },
];

const WEIGHTS = [
  { token: '--fw-light', label: '300 · light' },
  { token: '--fw-regular', label: '400 · regular' },
  { token: '--fw-semibold', label: '600 · semibold' },
  { token: '--fw-bold', label: '700 · bold' },
  { token: '--fw-heavy', label: '800 · heavy' },
];

const SAMPLE = 'Cocina lista: pedido #482 para la mesa 7';

export function TypographySection() {
  return (
    <Section
      id="tipografia"
      title="Tipografía"
      lead={
        <>
          <strong>Open Sans</strong> para toda la interfaz y <strong>Baloo 2</strong> solo para el
          wordmark (sustituto de MaditaBold). La escala es responsive: baja en dos escalones
          (860&nbsp;px y 480&nbsp;px) desde los propios tokens, sin tocar los componentes.
        </>
      }
    >
      <Specimen title="Familias" hint="--font-sans · --font-logo · --font-mono">
        <p className={styles.logoSample}>piddet</p>
        <p className={styles.textTone}>
          Open Sans — la voz del panel: formularios, tablas, botones y mensajes.
        </p>
        <p className={styles.textTone}>
          <Code>--font-mono</Code> para valores técnicos: SKU, tokens, montos alineados.
        </p>
      </Specimen>

      <Specimen title="Escala" hint="tokens --text-*; los títulos usan los pasos grandes, el cuerpo vive en --text-base">
        <div>
          {SCALE.map((s) => (
            <div key={s.token} className={styles.typeRow}>
              <span className={styles.typeMeta}>{s.token} · {s.label}</span>
              <p className={styles.typeSample} style={{ '--fs': `var(${s.token})` }}>{SAMPLE}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Pesos" hint="tokens --fw-*; los encabezados de tabla van en 600 con --ls-wide y mayúsculas">
        <div>
          {WEIGHTS.map((w) => (
            <div key={w.token} className={styles.typeRow}>
              <span className={styles.typeMeta}>{w.label}</span>
              <p className={styles.typeSample} style={{ '--fs': 'var(--text-md)', '--fw': `var(${w.token})` }}>{SAMPLE}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Tonos de texto" hint="--text-heading · --text-body · --text-muted (derivados de la escala de neutros)">
        <p className={[styles.textTone, styles.toneHeading].join(' ')}>Encabezado — gray-900, para títulos y valores importantes.</p>
        <p className={styles.textTone}>Cuerpo — gray-700, el tono por defecto de párrafos y celdas.</p>
        <p className={[styles.textTone, styles.toneMuted].join(' ')}>Atenuado — gray-500, para ayudas, metadatos y estados vacíos.</p>
      </Specimen>
    </Section>
  );
}
