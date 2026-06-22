// Registry de frames (plantillas de presentación de los productos de cada categoría).
// Añadir uno = crear su componente en ./components.jsx + una entrada aquí. Cada Component recibe
// { items } y renderiza solo el área de productos (el título de la categoría lo pone el diseño).
import { Grid2Frame, Grid2TextFrame, HeroFrame, HeroListFrame, Grid3Frame, ListFrame } from './components.jsx';

export const CATEGORY_FRAMES = {
  grid2: { label: '2 columnas con foto', Component: Grid2Frame },
  grid2text: { label: '2 columnas sin foto', Component: Grid2TextFrame },
  hero: { label: 'Destacado + lista', Component: HeroFrame },
  herolist: { label: 'Destacado con foto + lista', Component: HeroListFrame },
  grid3: { label: '3 columnas sin foto', Component: Grid3Frame },
  list: { label: 'Lista con foto', Component: ListFrame },
};

export const DEFAULT_FRAME = 'grid2';
