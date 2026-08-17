import React from 'react';
import { IconButton } from './IconButton.jsx';
import styles from './RefreshButton.module.css';

/** Botón para recargar los datos de la pantalla; gira mientras la carga está en curso. */
export function RefreshButton({ onClick, loading = false, size = 'sm', title = 'Actualizar', ...rest }) {
  return (
    <IconButton
      icon={`fas fa-rotate-right ${loading ? styles.spin : ''}`}
      variant="light"
      size={size}
      title={title}
      disabled={loading}
      onClick={onClick}
      {...rest}
    />
  );
}
