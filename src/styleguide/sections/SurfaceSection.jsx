import React from 'react';
import { Card, Button, Badge } from '../../components';
import { Section, Specimen, Row, Labeled, Code } from '../Specimen.jsx';
import styles from './sections.module.css';

const RADII = [
  { token: '--radius-sm', label: '0.25rem' },
  { token: '--radius', label: '0.375rem' },
  { token: '--radius-lg', label: '0.5rem' },
  { token: '--radius-xl', label: '0.75rem' },
  { token: '--radius-pill', label: 'píldora' },
];

const SHADOWS = [
  { token: '--shadow-xs', label: 'shadow-xs · realce sutil' },
  { token: '--shadow-lg', label: 'shadow-lg · flotantes (modales, popovers)' },
  { token: '--ring-primary', label: 'ring-primary · anillo de foco' },
];

export function SurfaceSection() {
  return (
    <Section
      id="superficie"
      title="Superficie y espaciado"
      lead={
        <>
          La superficie base es la <Code>Card</Code>: blanca, borde fino, sin sombra. Las sombras
          se reservan para elementos flotantes y el anillo naranja marca el foco de teclado.
        </>
      }
    >
      <Specimen title="Card" hint="superficie flat; Card.Header + Card.Body para tarjetas con título y acción">
        <Card>
          <Card.Header title="Ventas de hoy" action={<Button size="sm" variant="secondary" icon="fas fa-download">Exportar</Button>} />
          <Card.Body>
            El contenido vive dentro de <Code>Card.Body</Code>. Las tablas de listado van directo
            dentro de la <Code>Card</Code>, sin padding extra.
          </Card.Body>
        </Card>
      </Specimen>

      <Specimen title="Radios" hint="tokens --radius-*; la UI usa --radius por defecto y la píldora para badges y switches">
        <Row align="end">
          {RADII.map((r) => (
            <Labeled key={r.token} label={`${r.token} · ${r.label}`}>
              <div className={styles.radiusBox} style={{ '--rad': `var(${r.token})` }} />
            </Labeled>
          ))}
        </Row>
      </Specimen>

      <Specimen title="Sombras y foco" hint="uso mínimo en la línea flat: solo lo que flota proyecta sombra">
        <Row align="end">
          {SHADOWS.map((s) => (
            <Labeled key={s.token} label={s.label}>
              <div className={styles.shadowBox} style={{ '--sh': `var(${s.token})` }} />
            </Labeled>
          ))}
        </Row>
      </Specimen>

      <Specimen title="Layout" hint="dimensiones estructurales del panel">
        <Row>
          <Badge variant="neutral">--sidebar-w · 244px</Badge>
          <Badge variant="neutral">--topbar-h · 66px</Badge>
          <Badge variant="neutral">--container-max · 1180px</Badge>
          <Badge variant="neutral">breakpoint móvil · 860px</Badge>
          <Badge variant="neutral">breakpoint teléfono · 480px</Badge>
        </Row>
      </Specimen>
    </Section>
  );
}
