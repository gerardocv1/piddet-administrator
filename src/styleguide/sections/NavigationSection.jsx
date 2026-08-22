import React from 'react';
import { PageHeader, Dropdown, IconButton, Badge, Button, useToast } from '../../components';
import { Section, Specimen, Row, Code } from '../Specimen.jsx';

export function NavigationSection() {
  const { toast } = useToast();

  return (
    <Section
      id="navegacion"
      title="Navegación"
      lead={
        <>
          El chasis del panel son <Code>Sidebar</Code> + <Code>Topbar</Code> (viven en{' '}
          <Code>src/components/navigation</Code> y se montan desde el <Code>Layout</Code>; la barra
          lateral de esta guía sigue su misma línea). Dentro de cada pantalla, la cabecera de
          detalle es <Code>PageHeader</Code>.
        </>
      }
    >
      <Specimen title="PageHeader" hint="botón volver + subtítulo + acciones + rejilla de metadatos + nota; el título principal vive en el Topbar" bare>
        <PageHeader
          onBack={() => {}}
          subtitle="Factura #F-2026-0841"
          actions={
            <>
              <Badge variant="success" dot>Pagada</Badge>
              <Button size="sm" variant="secondary" icon="fas fa-print">Imprimir</Button>
              <Button size="sm" variant="danger" icon="fas fa-ban">Cancelar</Button>
            </>
          }
          meta={[
            { label: 'Cliente', value: 'Laura Restrepo' },
            { label: 'Tienda', value: 'Sede Centro' },
            { label: 'Fecha', value: '22 ago 2026 · 12:41' },
            { label: 'Total', value: '$ 48.500' },
          ]}
          note="Las facturas con efecto contable no se borran: se cancelan con motivo."
        />
      </Specimen>

      <Specimen title="Dropdown" hint="menú de acciones en portal (no lo recorta el overflow de la Card); items con variant 'danger'">
        <Row>
          <Dropdown
            trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" title="Acciones" />}
            items={[
              { label: 'Editar', icon: 'fas fa-pen', onClick: () => toast({ tone: 'info', title: 'Acción: editar' }) },
              { label: 'Duplicar', icon: 'fas fa-copy', onClick: () => toast({ tone: 'info', title: 'Acción: duplicar' }) },
              { label: 'Desactivar', icon: 'fas fa-ban', variant: 'danger', onClick: () => toast({ tone: 'neutral', title: 'Acción: desactivar' }) },
            ]}
          />
        </Row>
      </Specimen>
    </Section>
  );
}
