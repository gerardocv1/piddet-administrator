import React from 'react';
import { Button, Card, Input, Modal, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { auth as authLib } from '../lib/auth/index.js';
import s from './screens.module.css';
import t from './CompanyProfile.module.css';

// Frases de seguridad: al abrir el modal se elige una al azar y hay que ESCRIBIRLA a mano
// (pegar y soltar están bloqueados, y la frase mostrada no se puede seleccionar). Todas
// incluyen el nombre de la compañía: escribirlo es el doble check contra purgar la equivocada.
const PHRASES = [
  (name) => `quiero borrar para siempre el catálogo de ${name}`,
  (name) => `entiendo que los productos de ${name} no volverán`,
  (name) => `sí, elimina todos los menús y productos de ${name}`,
  (name) => `asumo que ${name} quedará sin productos ni menús`,
  (name) => `confirmo el borrado definitivo del catálogo de ${name}`,
];

// La comparación ignora mayúsculas, tildes y espacios repetidos: no castiga la escritura,
// pero sigue exigiendo la frase completa.
const normalize = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// Tarjeta del perfil de empresa: zona de peligro (solo con el permiso de plataforma
// company-catalog-purge, que trae únicamente el super-admin).
export function DangerZoneCard({ onPurged }) {
  const [purging, setPurging] = React.useState(false);
  const company = authLib.getCompany();

  return (
    <Card className={t.dangerCard}>
      <Card.Header title="Zona de peligro" />
      <Card.Body>
        <div className={t.dangerRow}>
          <div>
            <p className={t.dangerTitle}>Borrar todo el catálogo</p>
            <p className={t.dangerDesc}>
              Elimina de forma permanente los productos, sus opciones, las categorías propias y
              los menús de la empresa. No hay papelera ni vuelta atrás.
            </p>
          </div>
          <Button variant="danger" icon="fas fa-trash" onClick={() => setPurging(true)}>
            Borrar catálogo
          </Button>
        </div>
      </Card.Body>

      {purging && (
        <PurgeCatalogModal companyName={company?.name || ''} onClose={() => setPurging(false)}
          onPurged={() => { setPurging(false); onPurged?.(); }} />
      )}
    </Card>
  );
}

// ── Modal: confirmar la purga escribiendo la frase de seguridad ──
function PurgeCatalogModal({ companyName, onClose, onPurged }) {
  const [phrase] = React.useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)](companyName));
  const [typed, setTyped] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  const ready = normalize(typed) === normalize(phrase);
  const block = (e) => e.preventDefault();

  const purge = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.purgeCatalog();
      toast({ tone: 'neutral', title: 'Catálogo eliminado' });
      onPurged();
    } catch (e) {
      setErr(e?.message || 'No se pudo borrar el catálogo.');
      setSaving(false);
    }
  };

  return (
    <Modal open title="Borrar todo el catálogo" subtitle={companyName} size="sm" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" disabled={!ready} loading={saving} onClick={purge}>
          Borrar para siempre
        </Button>
      </>}>
      <div className={s.formCol}>
        <Alert tone="danger">
          Se eliminarán permanentemente todos los productos, sus opciones, las categorías propias
          y los menús de {companyName}. Esta acción no se puede deshacer.
        </Alert>
        <p className={t.dangerHint}>Para confirmar, escribe esta frase (no se puede pegar):</p>
        <p className={t.dangerPhrase}>{phrase}</p>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)}
          placeholder="Escribe la frase aquí" autoComplete="off" spellCheck={false}
          onPaste={block} onDrop={block} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
