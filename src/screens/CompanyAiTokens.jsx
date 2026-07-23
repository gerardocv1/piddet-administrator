import React from 'react';
import { Button, IconButton, Card, Badge, Input, Select, Modal, DataTable } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './CompanyProfile.module.css';

const EXPIRATION_OPTIONS = [
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 180, label: '180 días' },
  { value: 365, label: '1 año' },
  { value: 730, label: '2 años' },
];

// "2026-07-02T13:47:00" → "02/07/2026" (con hora opcional, sin depender de la zona del navegador).
const fmtDate = (value, withTime = false) => {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return String(value);
  return `${m[3]}/${m[2]}/${m[1]}${withTime && m[4] ? ` ${m[4]}:${m[5]}` : ''}`;
};

const isExpired = (tk) => tk.expires_at && new Date(tk.expires_at) < new Date();
const statusOf = (tk) => {
  if (tk.status === 0) return { label: 'Revocado', variant: 'neutral' };
  if (isExpired(tk)) return { label: 'Expirado', variant: 'warning' };
  return { label: 'Activo', variant: 'success' };
};

// Tarjeta del perfil de empresa: tokens de acceso para agentes de IA externos.
// El token completo solo se ve al generarlo; el listado muestra únicamente el prefijo.
export function AiTokensCard() {
  const { data: tokens, loading, error, reload } = useResource(api.aiTokens, [], []);
  const [creating, setCreating] = React.useState(false);
  const [revoking, setRevoking] = React.useState(null);

  const columns = [
    { key: 'name', header: 'Nombre', ellipsis: true },
    { key: 'token_prefix', header: 'Token', width: 140, render: (r) => <span className={t.tokenPrefix}>{r.token_prefix}…</span> },
    { key: 'status', header: 'Estado', width: 110, render: (r) => { const st = statusOf(r); return <Badge variant={st.variant} dot>{st.label}</Badge>; } },
    { key: 'expires_at', header: 'Expira', width: 110, render: (r) => fmtDate(r.expires_at) },
    { key: 'last_used_at', header: 'Último uso', width: 140, render: (r) => fmtDate(r.last_used_at, true) },
    {
      key: 'actions', header: '', width: 50, align: 'right',
      render: (r) => r.status === 1 && (
        <IconButton icon="fas fa-ban" variant="ghost" size="sm" title="Revocar token"
          onClick={() => setRevoking(r)} />
      ),
    },
  ];

  return (
    <Card>
      <Card.Header title="Tokens de IA"
        action={<Button size="sm" icon="fas fa-plus" onClick={() => setCreating(true)}>Generar token</Button>} />
      <Card.Body>
        <p className={t.tokenHint}>
          Permiten a agentes de IA externos consultar los datos de la empresa. El token completo
          solo se muestra al generarlo; guárdalo en un lugar seguro.
        </p>
        <DataTable columns={columns} rows={tokens || []} loading={loading}
          error={error ? 'No se pudieron cargar los tokens.' : null}
          empty="Aún no hay tokens de IA." />
      </Card.Body>

      {creating && <CreateTokenModal onClose={() => setCreating(false)} onCreated={reload} />}
      {revoking && <RevokeTokenModal token={revoking} onClose={() => setRevoking(null)}
        onRevoked={() => { setRevoking(null); reload(); }} />}
    </Card>
  );
}

// ── Modal: generar token (nombre + expiración) y revelado único del token ──
function CreateTokenModal({ onClose, onCreated }) {
  const [name, setName] = React.useState('');
  const [days, setDays] = React.useState(365);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [created, setCreated] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr('El nombre del token es obligatorio.'); return; }
    setSaving(true);
    setErr(null);
    try {
      const result = await api.createAiToken({ name: trimmed, expires_in_days: Number(days) });
      setCreated(result);
      onCreated();
    } catch (e) {
      setErr(e?.message || 'No se pudo generar el token.');
    } finally { setSaving(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => navigator.share({ title: 'Token de IA', text: created.token }).catch(() => {});

  if (created) {
    return (
      <Modal open title="Token generado" subtitle={created.agent_token?.name} size="md" onClose={onClose}
        footer={<Button variant="primary" onClick={onClose}>Listo</Button>}>
        <div className={s.formCol}>
          <div className={t.tokenReveal}>
            <code className={t.tokenValue}>{created.token}</code>
            <div className={t.tokenActions}>
              <Button variant="secondary" size="sm" icon={copied ? 'fas fa-check' : 'fas fa-copy'} onClick={copy}>
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              {typeof navigator.share === 'function' && (
                <Button variant="secondary" size="sm" icon="fas fa-share-nodes" onClick={share}>Compartir</Button>
              )}
            </div>
          </div>
          <p className={t.tokenWarn}>
            <i className="fas fa-triangle-exclamation" /> Copia el token ahora: por seguridad no se
            volverá a mostrar. Expira el {fmtDate(created.agent_token?.expires_at)}.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title="Generar token de IA" size="md" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Generar token</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre" placeholder="Ej. Agente de reservas" value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Un nombre que identifique para qué se usa este token." />
        <Select label="Expira en" value={days} options={EXPIRATION_OPTIONS}
          onChange={(e) => setDays(e.target.value)}
          hint="Al vencer, el agente pierde acceso y deberás generar un token nuevo." />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

// ── Modal: confirmar revocación (irreversible) ──
function RevokeTokenModal({ token, onClose, onRevoked }) {
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const revoke = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.revokeAiToken(token.id);
      onRevoked();
    } catch (e) {
      setErr(e?.message || 'No se pudo revocar el token.');
      setSaving(false);
    }
  };

  return (
    <Modal open title="Revocar token" subtitle={token.name} size="sm" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" loading={saving} onClick={revoke}>Revocar token</Button>
      </>}>
      <div className={s.formCol}>
        <p className={t.tokenHint}>
          El agente que use <span className={t.tokenPrefix}>{token.token_prefix}…</span> perderá el
          acceso de inmediato. Esta acción no se puede deshacer.
        </p>
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}
