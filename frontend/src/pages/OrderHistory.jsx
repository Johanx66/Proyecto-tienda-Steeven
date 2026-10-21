import { Table, Card, Badge, Collapse, Button } from 'react-bootstrap';
import { Fragment, useState } from 'react';
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

export default function OrderHistory() {
  const { orders, loading, error } = useOrders();
  const [openId, setOpenId] = useState(null);

  if (loading) return <LoadingSpinner message="Cargando tus pedidos..." />;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h4 className="mb-4">Historial de Compras</h4>
        <Alert message={error} />
        {orders.length === 0 ? (
          <p className="text-muted text-center py-4">Aún no tienes pedidos.</p>
        ) : (
          <Table responsive hover align="middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td>{order.id}</td>
                    <td>{new Date(order.fecha_creacion).toLocaleString('es-MX')}</td>
                    <td className="text-success fw-bold">${parseFloat(order.monto_total).toFixed(2)}</td>
                    <td>
                      <Badge bg={ESTADO_VARIANTS[order.estado] || 'secondary'} className="status-badge">
                        {order.estado}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setOpenId(openId === order.id ? null : order.id)}
                      >
                        {openId === order.id ? 'Ocultar' : 'Ver detalle'}
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="p-0 border-0">
                      <Collapse in={openId === order.id}>
                        <div className="p-3 bg-light">
                          <strong>Productos:</strong>
                          <ul className="mb-0 mt-2">
                            {order.detalles?.map((d, idx) => (
                              <li key={idx}>
                                {d.nombre} × {d.cantidad} — ${parseFloat(d.subtotal).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
