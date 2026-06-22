// Registry de diseños de la carta. Añadir un diseño nuevo = crear su componente + una entrada
// aquí; MenuPreview lo selecciona por clave (el `Component` recibe { menu, company, groups }).
import { ClassicLayout } from './ClassicLayout.jsx';

export const LAYOUTS = {
  classic: { label: 'Clásico', Component: ClassicLayout },
};

export const DEFAULT_LAYOUT = 'classic';
