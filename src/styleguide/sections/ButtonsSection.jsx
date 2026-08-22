import React from 'react';
import { Button, IconButton, RefreshButton } from '../../components';
import { Section, Specimen, Row, Labeled, Code } from '../Specimen.jsx';

const VARIANTS = ['primary', 'secondary', 'dark', 'success', 'danger', 'neutral', 'outline-primary'];
const ICON_VARIANTS = ['primary', 'light', 'danger', 'success', 'ghost'];

export function ButtonsSection() {
  const [refreshing, setRefreshing] = React.useState(false);
  const fakeRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <Section
      id="botones"
      title="Botones"
      lead={
        <>
          Estilo flat, sin sombra. <Code>primary</Code> (naranja) es la acción principal — una por
          pantalla; <Code>secondary</Code> acompaña; <Code>danger</Code> confirma acciones
          destructivas. <Code>loading</Code> conserva el color pleno (cargando no es lo mismo que
          deshabilitado).
        </>
      }
    >
      <Specimen title="Variantes" hint="prop variant de <Button>">
        <Row>
          {VARIANTS.map((v) => <Button key={v} variant={v}>{v}</Button>)}
        </Row>
      </Specimen>

      <Specimen title="Tamaños y formas" hint="size: sm | md | lg · pill · block (en móvil el md llega a 44 px)">
        <Row>
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
          <Button pill icon="fas fa-plus">Píldora</Button>
        </Row>
        <Button block variant="secondary">Bloque — ocupa todo el ancho (formularios en móvil)</Button>
      </Specimen>

      <Specimen title="Con icono y estados" hint="icon / iconRight (FontAwesome por clase) · loading · disabled">
        <Row>
          <Button icon="fas fa-plus">Nuevo producto</Button>
          <Button variant="secondary" iconRight="fas fa-arrow-right">Continuar</Button>
          <Button loading>Guardando…</Button>
          <Button disabled>Deshabilitado</Button>
          <Button variant="danger" icon="fas fa-ban">Cancelar factura</Button>
        </Row>
      </Specimen>

      <Specimen title="IconButton" hint="acciones de fila y toolbars; variant + size + round; title obligatorio (es el aria-label)">
        <Row>
          {ICON_VARIANTS.map((v) => (
            <Labeled key={v} label={v}>
              <IconButton icon="fas fa-pen" variant={v} title={`Editar (${v})`} />
            </Labeled>
          ))}
          <Labeled label="round">
            <IconButton icon="fas fa-qrcode" variant="light" round title="Código QR" />
          </Labeled>
          <Labeled label="sizes">
            <IconButton icon="fas fa-trash-can" variant="danger" size="sm" title="Pequeño" />
            <IconButton icon="fas fa-trash-can" variant="danger" size="md" title="Mediano" />
            <IconButton icon="fas fa-trash-can" variant="danger" size="lg" title="Grande" />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="RefreshButton" hint="recarga los datos de la pantalla; gira mientras loading (haz clic)">
        <Row>
          <RefreshButton onClick={fakeRefresh} loading={refreshing} />
        </Row>
      </Specimen>
    </Section>
  );
}
