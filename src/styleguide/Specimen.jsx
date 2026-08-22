import React from 'react';
import styles from './Specimen.module.css';

/** Bloque de sección de la guía: ancla, título, introducción y contenido. */
export function Section({ id, title, lead, children }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {lead && <p className={styles.sectionLead}>{lead}</p>}
      {children}
    </section>
  );
}

/** Muestra de la guía: tarjeta con título, nota de uso y lienzo donde vive el ejemplo. */
export function Specimen({ title, hint, children, bare = false }) {
  return (
    <div className={styles.specimen}>
      <div className={styles.specimenHead}>
        <h3 className={styles.specimenTitle}>{title}</h3>
        {hint && <p className={styles.specimenHint}>{hint}</p>}
      </div>
      <div className={bare ? styles.canvasBare : styles.canvas}>{children}</div>
    </div>
  );
}

/** Fila de ejemplos: envuelve y separa los ítems del lienzo. */
export function Row({ children, align = 'center' }) {
  return <div className={styles.row} data-align={align}>{children}</div>;
}

/** Ítem etiquetado dentro de una fila (la etiqueta va debajo, en gris). */
export function Labeled({ label, children, grow = false }) {
  return (
    <div className={[styles.labeled, grow ? styles.grow : ''].filter(Boolean).join(' ')}>
      <div className={styles.labeledBody}>{children}</div>
      <span className={styles.labeledTag}>{label}</span>
    </div>
  );
}

/** Nombre de token/prop en monoespaciada, para citar en las notas. */
export function Code({ children }) {
  return <code className={styles.code}>{children}</code>;
}
