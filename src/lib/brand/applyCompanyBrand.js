// La identidad de la compañía activa (perfil → Identidad visual) asoma en el PANEL solo como
// ACENTO: las variables `--company-accent*` que consumen la navegación y los realces
// decorativos (iconos del menú, pastillas de módulo, accesos rápidos). El primario de acción
// (botones, enlaces, foco) y el logo no se tocan. Se inyecta como hoja de estilo al final de
// <head> para ganarle a tokens.css con la misma especificidad; sin color elegido se retira y
// rigen los valores por defecto (primario petróleo y firma naranja en el sidebar).

import { buildCompanyAccent, buildCompanyAccentDark } from './palettes.js';

const STYLE_ID = 'company-brand-theme';
const block = (vars) => Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');

export function applyCompanyBrand(company) {
  const current = document.getElementById(STYLE_ID);
  if (!company?.brand_primary) {
    current?.remove();
    return;
  }
  // El bloque oscuro va después del claro: misma especificidad (0,1,0), gana el último.
  const css = `:root { ${block(buildCompanyAccent(company.brand_primary))} }\n`
    + `[data-theme="dark"] { ${block(buildCompanyAccentDark(company.brand_primary))} }`;
  const el = current || document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = css;
  if (!current) document.head.appendChild(el);
}
