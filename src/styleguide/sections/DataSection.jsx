import React from 'react';
import {
  Badge, Avatar, StatStrip, DataTable, Pagination, FilterBar, Card, Select,
} from '../../components';
import { Section, Specimen, Row, Labeled, Code } from '../Specimen.jsx';

const BADGES = ['primary', 'success', 'danger', 'warning', 'info', 'neutral'];

const STATS = [
  { label: 'Ventas de hoy', value: '$ 1.254.300', delta: '12%', up: true },
  { label: 'Pedidos', value: '86', delta: '4%', up: true },
  { label: 'Ticket promedio', value: '$ 14.585', delta: '3%', up: false },
  { label: 'Mesas activas', value: '9' },
];

const ORDER_STATUS = {
  paid: <Badge variant="success" dot>Pagado</Badge>,
  pending: <Badge variant="warning" dot>Pendiente</Badge>,
  cancelled: <Badge variant="danger" dot>Cancelado</Badge>,
};

const COLUMNS = [
  { key: 'number', header: 'Pedido', width: 90, nowrap: true },
  { key: 'customer', header: 'Cliente', ellipsis: true },
  { key: 'store', header: 'Tienda', ellipsis: true },
  { key: 'status', header: 'Estado', width: 120, render: (r) => ORDER_STATUS[r.status] },
  { key: 'total', header: 'Total', width: 110, align: 'right', nowrap: true },
];

const ROWS = [
  { id: 1, number: '#4821', customer: 'Laura Restrepo', store: 'Sede Centro', status: 'paid', total: '$ 48.500' },
  { id: 2, number: '#4822', customer: 'Andrés Mejía', store: 'Sede Norte', status: 'pending', total: '$ 22.900' },
  { id: 3, number: '#4823', customer: 'Camila Torres', store: 'Sede Centro', status: 'paid', total: '$ 61.300' },
  { id: 4, number: '#4824', customer: 'Julián Ospina', store: 'Sede Norte', status: 'cancelled', total: '$ 15.000' },
];

const FILTERS = [
  {
    key: 'store', label: 'Tienda', icon: 'fas fa-store', type: 'select',
    options: [
      { value: 'centro', label: 'Sede Centro' },
      { value: 'norte', label: 'Sede Norte' },
    ],
  },
  {
    key: 'status', label: 'Estado', icon: 'fas fa-circle-half-stroke', type: 'multi',
    options: [
      { value: 'paid', label: 'Pagado' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'cancelled', label: 'Cancelado' },
    ],
  },
  { key: 'onlyMine', label: 'Solo míos', icon: 'fas fa-user', type: 'toggle' },
];

export function DataSection() {
  const [tableState, setTableState] = React.useState('datos');
  const [page, setPage] = React.useState(6);
  const [filters, setFilters] = React.useState({ store: 'centro' });
  const [search, setSearch] = React.useState('');

  return (
    <Section
      id="datos"
      title="Datos y tablas"
      lead={
        <>
          El patrón de listado del panel: <Code>FilterBar</Code> arriba, <Code>DataTable</Code>{' '}
          dentro de una <Code>Card</Code> y <Code>Pagination</Code> debajo. La tabla centraliza los
          estados de carga, error y vacío para que todas las pantallas se vean igual.
        </>
      }
    >
      <Specimen title="Badge" hint="etiqueta de estado tipo píldora con tinte suave; dot añade el punto de color">
        <Row>
          {BADGES.map((v) => <Badge key={v} variant={v}>{v}</Badge>)}
        </Row>
        <Row>
          {BADGES.map((v) => <Badge key={v} variant={v} dot>con dot</Badge>)}
        </Row>
      </Specimen>

      <Specimen title="Avatar" hint="imagen o iniciales en gris neutro; sizes sm | md | lg | xl">
        <Row align="end">
          <Labeled label="sm"><Avatar name="Laura Restrepo" size="sm" /></Labeled>
          <Labeled label="md"><Avatar name="Andrés Mejía" size="md" /></Labeled>
          <Labeled label="lg"><Avatar name="Camila Torres" size="lg" /></Labeled>
          <Labeled label="xl"><Avatar name="Julián Ospina" size="xl" /></Labeled>
        </Row>
      </Specimen>

      <Specimen title="StatStrip" hint="franja de KPIs en un solo panel; delta con tendencia arriba/abajo">
        <StatStrip stats={STATS} />
      </Specimen>

      <Specimen title="FilterBar" hint="pocos filtros = dropdowns inline; en móvil, botón «Filtros» + bottom-sheet; chips removibles">
        <FilterBar
          filters={FILTERS}
          values={filters}
          onChange={setFilters}
          searchable
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar pedido…"
          resultCount={ROWS.length}
        />
      </Specimen>

      <Specimen title="DataTable" hint="encabezado gris en mayúsculas, filas con hairline; estados integrados — cámbialos con el selector">
        <Row>
          <Select size="sm" value={tableState} onChange={(e) => setTableState(e.target.value)}
            options={[
              { value: 'datos', label: 'Con datos' },
              { value: 'cargando', label: 'Cargando' },
              { value: 'error', label: 'Error' },
              { value: 'vacio', label: 'Vacío' },
            ]} />
        </Row>
        <Card>
          <DataTable
            columns={COLUMNS}
            rows={tableState === 'datos' ? ROWS : []}
            loading={tableState === 'cargando'}
            error={tableState === 'error' ? 'No se pudo cargar el listado. Intenta de nuevo.' : null}
            empty="Sin pedidos para los filtros elegidos."
            onRowClick={() => {}}
          />
        </Card>
      </Specimen>

      <Specimen title="Pagination" hint="controlado por page/lastPage; genera elipsis (1 … 5 [6] 7 … 20) y muestra el total">
        <Pagination page={page} lastPage={20} total={247} onChange={setPage} />
      </Specimen>
    </Section>
  );
}
