import React from 'react';
import { Section, Code } from '../Specimen.jsx';
import styles from './sections.module.css';

const PRINCIPLES = [
  {
    icon: 'fas fa-border-none',
    title: 'Línea flat «B2»',
    text: 'Superficies blancas con borde fino, sin sombras ni relieves. La sombra se reserva para lo que flota: modales, popovers y dropdowns.',
  },
  {
    icon: 'fas fa-fire',
    title: 'El naranja es la acción',
    text: 'Un solo acento de marca (#ff7c00) para la acción principal de cada pantalla. El resto de la UI es neutra (escala slate) para que el acento destaque.',
  },
  {
    icon: 'fas fa-swatchbook',
    title: 'Todo sale de los tokens',
    text: 'Colores, tipografía, radios y sombras viven en src/styles/tokens.css. Ningún componente escribe un color o espaciado a mano; así el tema oscuro es gratis.',
  },
  {
    icon: 'fas fa-boxes-stacked',
    title: 'Componentes del barril',
    text: 'Las pantallas se arman solo con piezas de src/components (import desde el barril). Antes de crear un componente nuevo, revisa si uno existente ya cubre el caso.',
  },
  {
    icon: 'fas fa-mobile-screen-button',
    title: 'Responsive de verdad',
    text: 'En móvil los modales suben como bottom-sheet, los filtros se acumulan en una hoja, y los botones alcanzan 44 px de alto táctil. La escala tipográfica baja en dos escalones.',
  },
  {
    icon: 'fas fa-ban',
    title: 'Nada se borra',
    text: 'La factura se cancela con motivo, el gasto se anula, la mesa se desactiva. La UI siempre ofrece la acción de negocio, nunca un «eliminar» destructivo.',
  },
  {
    icon: 'fas fa-circle-half-stroke',
    title: 'Claro y oscuro',
    text: 'El tema oscuro reasigna la escala de neutros y las superficies vía data-theme="dark". Toda pieza nueva debe revisarse en ambos temas (botón de la izquierda).',
  },
  {
    icon: 'fas fa-comment-dots',
    title: 'Feedback con escalera',
    text: 'Nota bajo el campo → Alert en línea → Alert de pantalla → Toast → ConfirmDialog. Cada mensaje tiene su nivel; un error de servidor nunca es un toast.',
  },
];

export function PrinciplesSection() {
  return (
    <Section
      id="principios"
      title="Principios"
      lead={
        <>
          Reglas que sostienen la coherencia del panel. Si una pieza nueva rompe alguna,
          probablemente no va aquí — o hay que discutirla primero en <Code>specs/guides/</Code>.
        </>
      }
    >
      <div className={styles.principles}>
        {PRINCIPLES.map((p) => (
          <article key={p.title} className={styles.principle}>
            <span className={styles.principleIcon}><i className={p.icon} aria-hidden="true" /></span>
            <h3 className={styles.principleTitle}>{p.title}</h3>
            <p className={styles.principleText}>{p.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
