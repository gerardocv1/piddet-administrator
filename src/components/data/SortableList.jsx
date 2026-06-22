import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import s from './SortableList.module.css';

/**
 * Lista vertical reordenable por arrastre (drag & drop), accesible y con soporte táctil.
 *
 * El orden se confirma al soltar: `onReorder(nextItems, { from, to })` recibe el array ya
 * reordenado para que el consumidor actualice estado y persista (un PUT por fila afectada,
 * porque el backend no expone reorden en lote).
 *
 * `renderItem(item, { handleProps, isDragging })` debe colocar `handleProps` sobre el elemento
 * que actúa como agarre (típicamente un icono de "grip").
 */
function SortableRow({ id, disabled, render }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const handleProps = { ...attributes, ...listeners, className: s.handle, type: 'button', 'aria-label': 'Arrastrar para reordenar' };
  return (
    <div ref={setNodeRef} style={style} className={[s.row, isDragging ? s.dragging : ''].filter(Boolean).join(' ')}>
      {render({ handleProps, isDragging })}
    </div>
  );
}

export function SortableList({ items = [], getId = (it) => it.id, onReorder, disabled = false, renderItem, className = '' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((it) => String(getId(it)));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder && onReorder(arrayMove(items, from, to), { from, to });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <div className={[s.list, className].filter(Boolean).join(' ')}>
          {items.map((it) => (
            <SortableRow key={getId(it)} id={String(getId(it))} disabled={disabled}
              render={({ handleProps, isDragging }) => renderItem(it, { handleProps, isDragging })} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
