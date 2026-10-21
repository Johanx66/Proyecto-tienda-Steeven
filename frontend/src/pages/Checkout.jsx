import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Card, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { checkoutSchema } from '../schemas/checkoutSchemas';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import useOrders from '../hooks/useOrders';
import Alert from '../components/Alert';
import VerificationModal from '../components/VerificationModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { direccion_envio: user?.direccion_envio || '' },
  });

  if (items.length === 0 && !showModal) {
    return (
      <Card className="text-center py-5 shadow-sm">
        <Card.Body>
          <h4>No hay productos para pagar</h4>
          <Button variant="success" onClick={() => navigate('/')}>Ir a la tienda</Button>
        </Card.Body>
      </Card>
    );
  }

  const onSubmit = async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        direccion_envio: data.direccion_envio,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      };
      const order = await createOrder(payload);
      setPedidoId(order.id);
      setShowModal(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/mis-pedidos');
  };

  return (
    <>
      <h4 className="mb-4">Checkout</h4>
      <Alert message={error} onClose={() => setError(null)} />
      <div className="row g-4">
        <div className="col-md-7">
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Datos de envío</h5>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                  <Form.Label>Dirección de envío</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Calle, número, colonia, ciudad..."
                    {...register('direccion_envio')}
                    isInvalid={!!errors.direccion_envio}
                  />
                  <Form.Control.Feedback type="invalid">{errors.direccion_envio?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Correo de confirmación</Form.Label>
                  <Form.Control value={user?.email || ''} disabled />
                  <Form.Text className="text-muted">
                    Recibirás un correo con un enlace para autorizar tu compra.
                  </Form.Text>
                </Form.Group>
                <Button type="submit" variant="success" size="lg" disabled={submitting}>
                  {submitting ? 'Procesando...' : 'Pagar y confirmar por correo'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-5">
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Resumen del pedido</h5>
              <ListGroup variant="flush">
                {items.map((item) => (
                  <ListGroup.Item key={item.producto_id} className="d-flex justify-content-between">
                    <span>{item.nombre} × {item.cantidad}</span>
                    <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span className="text-success">${total.toFixed(2)}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </div>
      </div>

      <VerificationModal
        show={showModal}
        pedidoId={pedidoId}
        email={user?.email}
        onClose={handleModalClose}
        onConfirmed={() => {}}
      />
      {submitting && <LoadingSpinner message="Creando pedido..." />}
    </>
  );
}
