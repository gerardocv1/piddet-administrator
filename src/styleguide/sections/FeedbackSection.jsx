import React from 'react';
import {
  Alert, Spinner, Button, Modal, ConfirmDialog, Input, MoneyInput, useToast,
} from '../../components';
import { Section, Specimen, Row, Labeled, Code } from '../Specimen.jsx';
import styles from './sections.module.css';

const TONES = ['info', 'success', 'warning', 'danger', 'primary'];

export function FeedbackSection() {
  const { toast } = useToast();
  const [modal, setModal] = React.useState(null); // 'sm' | 'md' | null
  const [confirm, setConfirm] = React.useState(null); // 'none' | 'required' | null

  return (
    <Section
      id="feedback"
      title="Feedback"
      lead="Cada mensaje tiene su nivel. La escalera decide qué componente usar: subir un escalón sin necesidad interrumpe; bajarlo deja pasar errores."
    >
      <Specimen title="La escalera de mensajes" hint="de menor a mayor interrupción">
        <ol className={styles.ladder}>
          <li><strong>Nota bajo el campo</strong> — evita el error antes de que ocurra (prop <Code>hint</Code>).</li>
          <li><strong>Alert en línea</strong> — consecuencia de lo que se edita aquí (dentro de la tarjeta o el modal).</li>
          <li><strong>Alert de pantalla</strong> — condición que afecta a toda la vista (bajo el PageHeader).</li>
          <li><strong>Toast</strong> — una acción ya terminó bien; confirma sin interrumpir.</li>
          <li><strong>ConfirmDialog / Modal sm</strong> — hay que aprobar algo que no se deshace.</li>
        </ol>
        <Alert tone="warning">
          Un error del servidor SIEMPRE es un <Code>Alert</Code> junto a la acción que falló — nunca un toast.
        </Alert>
      </Specimen>

      <Specimen title="Alert" hint="tone decide icono y color; variant 'quiet' por defecto, 'tint' solo para avisos que bloquean">
        {TONES.map((t) => (
          <Alert key={t} tone={t}>
            Alert <Code>{t}</Code> en variante quiet — el mensaje en línea estándar del panel.
          </Alert>
        ))}
        <Alert tone="danger" variant="tint" title="La factura no se pudo cancelar"
          action={<Button size="sm" variant="danger">Reintentar</Button>}>
          El servidor respondió 409: el turno ya está cerrado. Variante <Code>tint</Code>, solo
          para avisos que bloquean la operación.
        </Alert>
      </Specimen>

      <Specimen title="Spinner" hint="hereda el color del contexto (currentColor); center para zonas en carga">
        <Row align="end">
          <Labeled label="sm"><Spinner size="sm" /></Labeled>
          <Labeled label="md"><Spinner size="md" /></Labeled>
          <Labeled label="lg"><Spinner size="lg" /></Labeled>
          <Labeled grow label="center + label">
            <Spinner center label="Cargando indicadores…" />
          </Labeled>
        </Row>
      </Specimen>

      <Specimen title="Toast" hint="se lanza con useToast(); pila abajo a la derecha, máx. 3, autocierre a los 4 s">
        <Row>
          <Button variant="secondary" onClick={() => toast({ title: 'Producto guardado' })}>
            success
          </Button>
          <Button variant="secondary" onClick={() => toast({ tone: 'info', title: 'Sincronizando con el POS…' })}>
            info
          </Button>
          <Button variant="secondary" onClick={() => toast({ tone: 'warning', title: 'La tienda quedó sin horario hoy' })}>
            warning
          </Button>
          <Button variant="secondary"
            onClick={() => toast({ tone: 'neutral', title: 'Producto oculto del menú', actionLabel: 'Deshacer', onAction: () => {} })}>
            con acción
          </Button>
        </Row>
      </Specimen>

      <Specimen title="Modal" hint="sm = confirmación flotante; md/lg = crear/editar (bottom-sheet en móvil)">
        <Row>
          <Button variant="secondary" onClick={() => setModal('sm')}>Abrir modal sm</Button>
          <Button variant="secondary" onClick={() => setModal('md')}>Abrir modal md</Button>
        </Row>
        {modal === 'sm' && (
          <Modal size="sm" title="¿Cerrar el turno?" subtitle="Caja 1 · Sede Centro" onClose={() => setModal(null)}
            footer={
              <>
                <Button variant="neutral" onClick={() => setModal(null)}>Volver</Button>
                <Button onClick={() => setModal(null)}>Cerrar turno</Button>
              </>
            }>
            El efectivo contado se comparará contra el esperado y no podrás registrar más ventas en este turno.
          </Modal>
        )}
        {modal === 'md' && (
          <Modal size="md" title="Nuevo producto" subtitle="Se creará en la compañía activa" onClose={() => setModal(null)}
            footer={
              <>
                <Button variant="neutral" onClick={() => setModal(null)}>Cancelar</Button>
                <Button icon="fas fa-check" onClick={() => setModal(null)}>Guardar</Button>
              </>
            }>
            <Input label="Nombre" placeholder="Hamburguesa clásica" />
            <MoneyInput label="Precio" icon="fas fa-dollar-sign" />
          </Modal>
        )}
      </Specimen>

      <Specimen title="ConfirmDialog" hint="confirmación estándar para acciones destructivas; reason: none | optional | required">
        <Row>
          <Button variant="danger" onClick={() => setConfirm('none')}>Sin motivo</Button>
          <Button variant="danger" onClick={() => setConfirm('required')}>Motivo obligatorio</Button>
        </Row>
        <ConfirmDialog
          open={confirm === 'none'}
          title="¿Anular el gasto?"
          confirmLabel="Anular gasto"
          onConfirm={() => setConfirm(null)}
          onClose={() => setConfirm(null)}>
          El gasto quedará anulado y no contará en los reportes. Esta acción no se puede deshacer.
        </ConfirmDialog>
        <ConfirmDialog
          open={confirm === 'required'}
          title="¿Cancelar la factura?"
          confirmLabel="Cancelar factura"
          reason="required"
          reasonLabel="Motivo de la cancelación"
          reasonPlaceholder="Ej.: error en los ítems facturados"
          onConfirm={() => setConfirm(null)}
          onClose={() => setConfirm(null)}>
          La factura quedará cancelada con el motivo que indiques; el botón se habilita al escribirlo.
        </ConfirmDialog>
      </Specimen>
    </Section>
  );
}
