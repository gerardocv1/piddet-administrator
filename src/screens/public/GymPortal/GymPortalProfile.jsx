import React from 'react';
import { Spinner } from '../../../components';
import { GYM_SEX_OPTIONS } from '../../../lib/gymLabels.js';
import { ID_TYPES } from '../../../lib/reservationLabels.js';
import { BirthdateSelects, birthdateIso, birthdateParts, birthdateProblem } from './BirthdateSelects.jsx';
import { PhotoCropper } from './PhotoCropper.jsx';
import { CameraIcon, CheckIcon, ChevronDownIcon, LockIcon, TrashIcon } from './icons.jsx';
import s from './GymPortalProfile.module.css';

// Perfil del socio en el portal: su foto (la elige, la recorta y queda) y los datos que puede
// corregir él mismo. Nombre y celular solo se muestran: son su identidad y su llave de entrada,
// y se cambian en recepción.

const initials = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

// "3001234567" → "300 123 4567".
const formatPhone = (digits) => {
  const d = String(digits || '').replace(/\D+/g, '');
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
};

const formFrom = (profile) => ({
  email: profile?.email || '',
  id_type_id: profile?.id_type_id ? String(profile.id_type_id) : '',
  id_number: profile?.id_number || '',
  birth: birthdateParts(profile?.birthdate),
  sex: profile?.sex || '',
  goal_id: profile?.goal_id ? String(profile.goal_id) : '',
});

/** Solo lo que cambió, en el formato del backend. */
function changesOf(form, profile) {
  const base = formFrom(profile);
  const out = {};
  if (form.email.trim() !== base.email) out.email = form.email.trim() || null;
  if (form.id_type_id !== base.id_type_id) out.id_type_id = form.id_type_id ? Number(form.id_type_id) : null;
  if (form.id_number.trim() !== base.id_number) out.id_number = form.id_number.trim() || null;
  if (birthdateIso(form.birth) !== birthdateIso(base.birth)) out.birthdate = birthdateIso(form.birth);
  if (form.sex !== base.sex) out.sex = form.sex || null;
  if (form.goal_id !== base.goal_id) out.goal_id = form.goal_id ? Number(form.goal_id) : null;
  // El número de documento viaja con su tipo: el backend valida que no sea de otra persona.
  if ('id_number' in out && !('id_type_id' in out) && form.id_type_id) out.id_type_id = Number(form.id_type_id);
  return out;
}

function Field({ id, label, children, hint }) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      {children}
      {hint && <p className={s.fieldHint}>{hint}</p>}
    </div>
  );
}

function SelectBox({ id, value, onChange, placeholder, options }) {
  return (
    <div className={s.selectWrap}>
      <select id={id} className={[s.input, s.select, value ? '' : s.empty].filter(Boolean).join(' ')} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon size={16} className={s.chevron} />
    </div>
  );
}

export function GymPortalProfile({ data, onSaveProfile, onUploadPhoto, onRemovePhoto }) {
  const profile = data.profile || {};
  const member = data.member || {};
  const goals = data.goals || [];
  const [form, setForm] = React.useState(() => formFrom(profile));
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState(null); // { tone: 'ok'|'error', text }
  const [photoMessage, setPhotoMessage] = React.useState(null);
  const [cropSrc, setCropSrc] = React.useState(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const [photoFailed, setPhotoFailed] = React.useState(false);
  const fileRef = React.useRef(null);

  // Si los datos llegan de nuevo (refresco al volver a la app), el formulario los toma mientras
  // el socio no tenga cambios sin guardar.
  const dirty = Object.keys(changesOf(form, profile)).length > 0;
  React.useEffect(() => {
    if (!dirty) setForm(formFrom(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  React.useEffect(() => { setPhotoFailed(false); }, [member.photo_url]);
  React.useEffect(() => () => { if (cropSrc) URL.revokeObjectURL(cropSrc); }, [cropSrc]);

  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setMessage(null); };

  const save = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;
    const problem = birthdateProblem(form.birth);
    if (problem) { setMessage({ tone: 'error', text: problem }); return; }
    if (!birthdateIso(form.birth)) { setMessage({ tone: 'error', text: 'Elige tu fecha de nacimiento completa: es la que usas para entrar.' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      await onSaveProfile(changesOf(form, profile));
      setMessage({ tone: 'ok', text: 'Guardamos tus datos.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'No pudimos guardar tus datos. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir la misma foto
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoMessage({ tone: 'error', text: 'Elige una imagen (foto de tu galería o de la cámara).' });
      return;
    }
    setPhotoMessage(null);
    setCropSrc(URL.createObjectURL(file));
  };

  const confirmPhoto = async (file) => {
    await onUploadPhoto(file); // si falla, el recorte muestra el error y sigue abierto
    setCropSrc(null);
    setPhotoMessage({ tone: 'ok', text: 'Tu foto quedó lista.' });
  };

  const removePhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    try {
      await onRemovePhoto();
      setPhotoMessage({ tone: 'ok', text: 'Quitamos tu foto.' });
    } catch (err) {
      setPhotoMessage({ tone: 'error', text: err?.message || 'No pudimos quitar tu foto.' });
    } finally {
      setPhotoBusy(false);
    }
  };

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || member.member_name;
  const hasPhoto = member.photo_url && !photoFailed;

  return (
    <>
      <div className={s.head}>
        <h1 className={s.title}>Tu perfil</h1>
        {member.member_code && <span className={s.code}>{member.member_code}</span>}
      </div>

      <section className={s.photoCard} aria-label="Foto de perfil">
        <button type="button" className={s.photoBtn} onClick={() => fileRef.current?.click()} aria-label={hasPhoto ? 'Cambiar foto' : 'Agregar foto'}>
          <span className={s.photo}>
            {hasPhoto
              ? <img src={member.photo_url} alt="" onError={() => setPhotoFailed(true)} />
              : <span className={s.photoInitials}>{initials(fullName)}</span>}
          </span>
          <span className={s.cameraBadge} aria-hidden="true"><CameraIcon size={18} /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className={s.hiddenInput} onChange={pickPhoto} tabIndex={-1} aria-hidden="true" />
        <div className={s.photoActions}>
          <button type="button" className={s.photoLink} onClick={() => fileRef.current?.click()}>
            {hasPhoto ? 'Cambiar foto' : 'Agregar foto'}
          </button>
          {member.photo_url && (
            <button type="button" className={[s.photoLink, s.photoRemove].join(' ')} onClick={removePhoto} disabled={photoBusy}>
              {photoBusy ? <Spinner size="sm" /> : <TrashIcon size={16} />}
              <span>Quitar</span>
            </button>
          )}
        </div>
        {photoMessage && (
          <p className={[s.message, photoMessage.tone === 'ok' ? s.messageOk : s.messageError].join(' ')} role={photoMessage.tone === 'ok' ? 'status' : 'alert'}>
            {photoMessage.tone === 'ok' && <CheckIcon size={16} />}
            {photoMessage.text}
          </p>
        )}
      </section>

      <section className={s.locked} aria-label="Datos que se cambian en recepción">
        <div className={s.lockedRow}>
          <span className={s.lockedLabel}>Nombre</span>
          <span className={s.lockedValue}>{fullName}</span>
        </div>
        <div className={s.lockedRow}>
          <span className={s.lockedLabel}>Celular</span>
          <span className={s.lockedValue}>+{String(profile.phone_code || '57').replace(/\D+/g, '')} {formatPhone(profile.phone_number)}</span>
        </div>
        <p className={s.lockedHint}>
          <LockIcon size={14} />
          Para cambiar tu nombre o tu celular, pasa por recepción.
        </p>
      </section>

      <form className={s.form} onSubmit={save} noValidate>
        <h2 className={s.h2}>Tus datos</h2>

        <Field id="profile-email" label="Correo">
          <input
            id="profile-email" className={s.input} type="email" inputMode="email" autoComplete="email"
            placeholder="tucorreo@ejemplo.com" value={form.email} onChange={(e) => set('email')(e.target.value)}
          />
        </Field>

        <div className={s.row}>
          <Field id="profile-id-type" label="Documento">
            <SelectBox id="profile-id-type" value={form.id_type_id} onChange={set('id_type_id')} placeholder="Tipo" options={ID_TYPES} />
          </Field>
          <Field id="profile-id-number" label="Número">
            <input
              id="profile-id-number" className={s.input} type="text" autoComplete="off"
              placeholder="Número" value={form.id_number} onChange={(e) => set('id_number')(e.target.value)}
            />
          </Field>
        </div>

        <div className={s.field}>
          <span className={s.label}>Fecha de nacimiento</span>
          <BirthdateSelects idPrefix="profile" value={form.birth} onChange={set('birth')} />
          <p className={s.fieldHint}>Es la que usas para entrar al portal.</p>
        </div>

        <div className={s.field}>
          <span className={s.label} id="profile-sex-label">Sexo</span>
          <div className={s.segment} role="group" aria-labelledby="profile-sex-label">
            {GYM_SEX_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={[s.segmentBtn, form.sex === o.value ? s.segmentOn : ''].filter(Boolean).join(' ')}
                aria-pressed={form.sex === o.value}
                onClick={() => set('sex')(form.sex === o.value ? '' : o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className={s.fieldHint}>Define la silueta de tus medidas.</p>
        </div>

        {goals.length > 0 && (
          <Field id="profile-goal" label="Tu objetivo">
            <SelectBox
              id="profile-goal" value={form.goal_id} onChange={set('goal_id')} placeholder="Sin definir"
              options={goals.map((g) => ({ value: String(g.id), label: g.label }))}
            />
          </Field>
        )}

        {message && (
          <p className={[s.message, message.tone === 'ok' ? s.messageOk : s.messageError].join(' ')} role={message.tone === 'ok' ? 'status' : 'alert'}>
            {message.tone === 'ok' && <CheckIcon size={16} />}
            {message.text}
          </p>
        )}

        <button type="submit" className={s.save} disabled={!dirty || saving}>
          {saving ? <><Spinner size="sm" /><span>Guardando…</span></> : <span>Guardar cambios</span>}
        </button>
      </form>

      {cropSrc && (
        <PhotoCropper src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={confirmPhoto} />
      )}
    </>
  );
}
