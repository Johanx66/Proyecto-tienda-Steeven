import { useState } from 'react';
import { Table, Card, Badge, Button, Form } from 'react-bootstrap';
import useOrders from '../hooks/useOrders';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const ESTADO_VARIANTS = {
  PENDIENTE_VERIFICACION: 'warning',
  CONFIRMADO: 'success',
  CANCELADO_FRAUDE: 'danger',
  NO_CONFIRMADO: 'secondary',
  DESPACHADO: 'info',
};

const ESTADOS = ['', 'PENDIENTE_VERIFICACION', 'CONFIRMADO', 'CANCELADO_FRAUDE', 'NO_CONFIRMADO', 'DESPACHADO'];

export default function AdminOrders() {
  const [estado, setEstado] = useState('');
  const { orders, loading, error, despachar } = useOrders({ admin: true, estado: estado || null });
  const [actionError, setActionError] = useState(null);

  const handleDespachar = async (id) => {
    setActionError(null);
    try {
      await despachar(id);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Error al despachar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Gestión de Pedidos</h5>
        <Form.Select style={{ maxWidth: 250 }} value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e || 'Todos los estados'}</option>
          ))}
        </Form.Select>
      </div>
      <Alert message={error || actionError} onClose={() => setActionError(null)} />
      <Table responsive hover align="middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.cliente_nombre}</td>
              <td>{o.cliente_telefono}</td>
              <td>{o.cliente_email}</td>
              <td className="text-success fw-bold">${parseFloat(o.monto_total).toFixed(2)}</td>
              <td>
                <Badge bg={ESTADO_VARIANTS[o.estado] || 'secondary'} className="status-badge">{o.estado}</Badge>
              </td>
              <td>{new Date(o.fecha_creacion).toLocaleString('es-MX')}</td>
              <td>
                {o.estado === 'CONFIRMADO' && (
                  <Button variant="outline-info" size="sm" onClick={() => handleDespachar(o.id)}>Despachar</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
