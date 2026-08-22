import React from 'react';
import {
  Input, MoneyInput, Select, Checkbox, Switch, Textarea, Autocomplete, DatePicker,
} from '../../components';
import { Section, Specimen, Row, Labeled, Code } from '../Specimen.jsx';

const DEMO_PRODUCTS = [
  { id: 1, name: 'Hamburguesa clásica', sku: 'HB-001' },
  { id: 2, name: 'Hamburguesa doble', sku: 'HB-002' },
  { id: 3, name: 'Papas medianas', sku: 'PP-010' },
  { id: 4, name: 'Papas grandes', sku: 'PP-011' },
  { id: 5, name: 'Gaseosa 400 ml', sku: 'BD-020' },
  { id: 6, name: 'Malteada de vainilla', sku: 'BD-031' },
];

export function FormsSection() {
  const [price, setPrice] = React.useState('12500');
  const [date, setDate] = React.useState('2026-08-22');
  const [product, setProduct] = React.useState(null);

  // Fetcher de demostración: filtra el catálogo local con una pequeña latencia,
  // para ver el cargador del Autocomplete como con un backend real.
  const searchProducts = React.useCallback((q) => {
    const term = q.toLowerCase();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(DEMO_PRODUCTS.filter(
          (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
        ));
      }, 400);
    });
  }, []);

  return (
    <Section
      id="formularios"
      title="Formularios"
      lead={
        <>
          Todos los campos comparten anatomía: etiqueta arriba, borde <Code>--border-input</Code>,
          ayuda o error debajo. El error pinta el borde y el texto en <Code>danger</Code>; la ayuda
          es <Code>--text-muted</Code>.
        </>
      }
    >
      <Specimen title="Input" hint="label · icon · hint · error; type=password incluye mostrar/ocultar">
        <Row align="start">
          <Labeled grow label="con icono y ayuda">
            <Input label="Nombre del producto" icon="fas fa-burger" placeholder="Hamburguesa clásica"
              hint="Como aparecerá en el menú y el POS." />
          </Labeled>
          <Labeled grow label="con error">
            <Input label="Correo" icon="fas fa-envelope" defaultValue="correo@invalido"
              error="Ingresa un correo válido." />
          </Labeled>
        </Row>
        <Row align="start">
          <Labeled grow label="password">
            <Input label="Contraseña" type="password" icon="fas fa-lock" defaultValue="secreta123" />
          </Labeled>
          <Labeled grow label="disabled">
            <Input label="Compañía" defaultValue="Piddet Burgers" disabled />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="MoneyInput" hint="formato colombiano (miles con punto, decimal con coma); emite el valor canónico que espera el backend">
        <Row align="start">
          <Labeled grow label={`canónico emitido: "${price}"`}>
            <MoneyInput label="Precio de venta" icon="fas fa-dollar-sign" value={price} onChange={setPrice} />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="Select y Textarea" hint="select nativo con estilo de input; textarea con la misma anatomía">
        <Row align="start">
          <Labeled grow label="select">
            <Select label="Categoría" icon="fas fa-tag"
              options={[
                { value: 'burgers', label: 'Hamburguesas' },
                { value: 'sides', label: 'Acompañamientos' },
                { value: 'drinks', label: 'Bebidas' },
              ]} />
          </Labeled>
          <Labeled grow label="textarea">
            <Textarea label="Descripción" rows={3} placeholder="Carne 150 g, queso cheddar, pan artesanal…"
              hint="Visible en el menú público." />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="Checkbox y Switch" hint="checkbox para opciones dentro de un formulario; switch para estados on/off inmediatos">
        <Row>
          <Checkbox label="Disponible en domicilios" defaultChecked />
          <Checkbox label="Requiere edad mínima" />
          <Checkbox label="Deshabilitado" disabled />
        </Row>
        <Row>
          <Switch label="Tienda abierta" defaultChecked />
          <Switch label="Compacto" size="sm" defaultChecked />
          <Switch label="Deshabilitado" disabled />
        </Row>
      </Specimen>

      <Specimen title="DatePicker" hint="calendario react-day-picker; value/onChange en ISO; variant 'input' o 'chip' (filtros)">
        <Row align="start">
          <Labeled grow label={`valor: ${date}`}>
            <DatePicker label="Fecha del gasto" icon="fas fa-calendar" value={date} onChange={setDate} />
          </Labeled>
          <Labeled label="variant=chip">
            <DatePicker variant="chip" label="Fecha" icon="fas fa-calendar" value={date} onChange={setDate} />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="Autocomplete" hint="búsqueda asíncrona con debounce (mín. 3 letras) — escribe «ham» o «pp»">
        <Row align="start">
          <Labeled grow label={product ? `seleccionado: ${product.name}` : 'sin selección'}>
            <Autocomplete
              label="Producto"
              placeholder="Busca por nombre o SKU (mín. 3 letras)"
              fetcher={searchProducts}
              value={product}
              onChange={setProduct}
              getOptionLabel={(p) => p.name}
              getOptionValue={(p) => p.id}
              renderOption={(p) => <>{p.name} · {p.sku}</>}
            />
          </Labeled>
        </Row>
      </Specimen>
    </Section>
  );
}
