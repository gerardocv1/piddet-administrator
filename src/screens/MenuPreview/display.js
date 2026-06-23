import React from 'react';
import { DEFAULT_SHOW } from './options.js';

// Visibilidad de los elementos opcionales de la carta, compartida con los frames sin tener que
// pasar props por cada plantilla. El diseño la provee; `ItemBody` (en frames/shared.jsx) la lee
// para mostrar/ocultar la línea de puntos y la descripción de cada producto.
export const DisplayContext = React.createContext(DEFAULT_SHOW);
export const useDisplay = () => React.useContext(DisplayContext);
