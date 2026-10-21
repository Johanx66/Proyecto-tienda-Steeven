import { Modal, Button } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ESTADO_LABELS = {
  PENDIENTE_VERIFICACION: { text: 'Esperando confirmación por correo...', variant: 'warning' },
  CONFIRMADO: { text: '¡Pedido confirmado!', variant: 'success' },
  CANCELADO_FRAUDE: { text: 'Pedido cancelado por seguridad', variant: 'danger' },
  NO_CONFIRMADO: { text: 'No se pudo confirmar (enlace no usado)', variant: 'secondary' },
  DESPACHADO: { text: 'Pedido despachado', variant: 'info' },
};

export default function VerificationModal({ show, pedidoId, email, onClose, onConfirmed }) {
  const [estado, setEstado] = useState('PENDIENTE_VERIFICACION');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const onConfirmedRef = useRef(onConfirmed);

  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  }, [onConfirmed]);

  useEffect(() => {
    if (show && pedidoId) {
      setEstado('PENDIENTE_VERIFICACION');
      setElapsed(0);

      intervalRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/pedidos/mis-pedidos');
          const pedido = data.find((p) => p.id === pedidoId);
          if (pedido && pedido.estado !== 'PENDIENTE_VERIFICACION') {
            setEstado(pedido.estado);
            clearInterval(intervalRef.current);
            clearInterval(timerRef.current);
            if (pedido.estado === 'CONFIRMADO' && onConfirmedRef.current) onConfirmedRef.current();
          }
        } catch (e) {
          // silencioso
        }
      }, 3000);

      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [show, pedidoId]);

  const label = ESTADO_LABELS[estado] || ESTADO_LABELS.PENDIENTE_VERIFICACION;
  const finalizado = estado !== 'PENDIENTE_VERIFICACION';

  return (
    <Modal show={show} onHide={finalizado ? onClose : undefined} backdrop={finalizado ? true : 'static'} keyboard={finalizado}>
      <Modal.Header>
        <Modal.Title>Confirmación por Correo en Curso</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {!finalizado ? (
          <>
            <div className="mb-3">
              <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Enviando correo...</span>
              </div>
            </div>
            <h5>✉️ Te enviamos un correo electrónico</h5>
            <p className="text-muted">
              Revisa la bandeja de <strong>{email}</strong> y abre el enlace para autorizar tu pedido.
              Si no reconoces esta compra, usa el enlace de reporte.
            </p>
            <p className="text-muted small">Tiempo transcurrido: {elapsed}s</p>
          </>
        ) : (
          <>
            <h5 className={`text-${label.variant} mb-3`}>{label.text}</h5>
            {estado === 'CONFIRMADO' && <p>Tu pedido ha sido verificado y será despachado.</p>}
            {estado === 'CANCELADO_FRAUDE' && <p>Un agente de seguridad revisará el caso.</p>}
            {estado === 'NO_CONFIRMADO' && <p>El enlace de confirmación no fue utilizado. Intenta nuevamente.</p>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {finalizado && (
          <Button variant="success" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
