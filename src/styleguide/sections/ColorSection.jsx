import React from 'react';
import { Section, Specimen } from '../Specimen.jsx';
import styles from './sections.module.css';

const GROUPS = [
  {
    title: 'Marca',
    hint: 'El naranja piddet y su escala; el teal secundario; el petróleo de sidebar/login.',
    tokens: [
      '--color-primary', '--color-primary-600', '--color-primary-700', '--color-primary-300',
      '--color-primary-100', '--color-primary-050', '--gradient-primary',
      '--color-accent', '--color-accent-100', '--brand-dark', '--brand-dark-2',
    ],
  },
  {
    title: 'Neutros (slate)',
    hint: 'Escala de grises azulados. En tema oscuro se invierte: 900 pasa a ser el texto claro.',
    tokens: [
      '--gray-900', '--gray-800', '--gray-700', '--gray-600', '--gray-500',
      '--gray-400', '--gray-300', '--gray-200', '--gray-100', '--white',
    ],
  },
  {
    title: 'Semánticos',
    hint: 'Base para realces, -100 como tinte de fondo y -fg como texto legible sobre claro.',
    tokens: [
      '--color-success', '--color-success-100', '--color-success-fg',
      '--color-info', '--color-info-100', '--color-info-fg',
      '--color-warning', '--color-warning-100', '--color-warning-fg',
      '--color-danger', '--color-danger-100',
    ],
  },
  {
    title: 'Superficies y bordes',
    hint: 'Fondo del cuerpo, tarjeta, bordes y el scrim de los modales.',
    tokens: ['--bg-body', '--surface-card', '--border-color', '--border-input', '--overlay-bg'],
  },
];

const ALL_TOKENS = GROUPS.flatMap((g) => g.tokens);

/** Lee el valor computado de cada variable para mostrarlo junto a la muestra;
 *  se recalcula al cambiar el tema. */
function useResolvedTokens(theme) {
  const [values, setValues] = React.useState({});
  React.useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const next = {};
    ALL_TOKENS.forEach((name) => { next[name] = cs.getPropertyValue(name).trim(); });
    setValues(next);
  }, [theme]);
  return values;
}

function Swatch({ name, value }) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchColor} style={{ '--sw': `var(${name})` }} />
      <div className={styles.swatchInfo}>
        <span className={styles.swatchName}>{name}</span>
        <span className={styles.swatchValue}>{value}</span>
      </div>
    </div>
  );
}

export function ColorSection({ theme }) {
  const values = useResolvedTokens(theme);
  return (
    <Section
      id="color"
      title="Color"
      lead="Paleta completa del panel. Cada muestra indica su variable CSS y el valor resuelto en el tema activo — cambia el tema en la barra lateral para ver la reasignación del modo oscuro."
    >
      {GROUPS.map((g) => (
        <Specimen key={g.title} title={g.title} hint={g.hint}>
          <div className={styles.swatches}>
            {g.tokens.map((t) => <Swatch key={t} name={t} value={values[t] || ''} />)}
          </div>
        </Specimen>
      ))}
    </Section>
  );
}
