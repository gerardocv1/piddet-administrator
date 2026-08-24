// Retiñe el PANEL con el color primario que la compañía activa eligió en su perfil (Identidad
// visual): la misma paleta curada de las páginas públicas, aplicada aquí a la escala completa de
// `--color-primary` en claro y oscuro. Se inyecta como hoja de estilo al final de <head> para
// ganarle a tokens.css con la misma especificidad; sin color elegido se retira y el panel vuelve
// al azul petróleo por defecto.

import { buildBrandTheme, buildBrandThemeDark } from './palettes.js';

const STYLE_ID = 'company-brand-theme';
const block = (vars) => Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');

export function applyCompanyBrand(company) {
  const current = document.getElementById(STYLE_ID);
  if (!company?.brand_primary) {
    current?.remove();
    return;
  }
  // El bloque oscuro va después del claro: misma especificidad (0,1,0), gana el último.
  const css = `:root { ${block(buildBrandTheme(company.brand_primary, company.brand_secondary))} }\n`
    + `[data-theme="dark"] { ${block(buildBrandThemeDark(company.brand_primary, company.brand_secondary))} }`;
  const el = current || document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = css;
  if (!current) document.head.appendChild(el);
}
