import React from 'react';
import { Select } from './Select.jsx';
import styles from './CategoryCascader.module.css';

// Selección de categoría en CASCADA sobre un árbol (raíces con children[]). Va revelando un
// <Select> por nivel a medida que se elige: Categoría → Subcategoría → … El valor resultante es el
// id del nodo MÁS PROFUNDO elegido (la hoja del camino); el usuario puede detenerse en un nivel
// intermedio. Devuelve ese id por `onChange`.
export function CategoryCascader({
  tree = [],
  value = '',
  onChange,
  disabled = false,
  loading = false,
  placeholder = 'Selecciona una categoría',
}) {
  // Camino (lista de ids) del value dentro del árbol; reconstruye la cascada al editar.
  const path = React.useMemo(() => findPath(tree, value), [tree, value]);

  // Niveles a mostrar: nivel 0 = raíces; cada siguiente = hijos del elegido en el nivel anterior.
  const levels = [];
  let options = tree;
  for (let i = 0; options && options.length > 0; i++) {
    const selectedId = path[i] != null ? String(path[i]) : '';
    levels.push({ options, selectedId });
    const selectedNode = options.find((n) => String(n.id) === selectedId);
    if (!selectedNode || !selectedNode.children?.length) break;
    options = selectedNode.children;
  }

  const handleLevelChange = (levelIndex, newId) => {
    if (!newId) {
      // Limpiar este nivel: el valor pasa al del nivel padre (o vacío si es el primero).
      const parentId = levelIndex > 0 ? path[levelIndex - 1] : '';
      onChange(parentId ? String(parentId) : '');
      return;
    }
    onChange(String(newId));
  };

  if (loading) {
    return <Select label="Categoría" disabled options={[{ value: '', label: 'Cargando…' }]} />;
  }

  return (
    <div className={styles.cascader}>
      {levels.map((lvl, i) => (
        <Select
          key={i}
          label={i === 0 ? 'Categoría' : 'Subcategoría'}
          icon={i === 0 ? 'fas fa-tags' : 'fas fa-angle-right'}
          value={lvl.selectedId}
          disabled={disabled}
          onChange={(e) => handleLevelChange(i, e.target.value)}
          options={[
            { value: '', label: i === 0 ? placeholder : 'Sin subcategoría' },
            ...lvl.options.map((n) => ({
              value: String(n.id),
              label: n.children?.length ? `${n.name} ›` : n.name,
            })),
          ]}
        />
      ))}
    </div>
  );
}

// Busca la ruta (ids raíz→nodo) de un id objetivo dentro del árbol.
function findPath(nodes, targetId, acc = []) {
  if (!targetId) return [];
  for (const n of nodes) {
    const next = [...acc, n.id];
    if (String(n.id) === String(targetId)) return next;
    if (n.children?.length) {
      const found = findPath(n.children, targetId, next);
      if (found.length) return found;
    }
  }
  return [];
}
