import { Table, Button, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function Cart() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Card className="text-center py-5 shadow-sm">
        <Card.Body>
          <h4>Tu carrito está vacío</h4>
          <p className="text-muted">Agrega productos frescos para comenzar.</p>
          <Button variant="success" onClick={() => navigate('/')}>Ir a la tienda</Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h4 className="mb-4">Carrito de Compras</h4>
        <Table responsive hover align="middle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.producto_id}>
                <td>{item.nombre}</td>
                <td>${item.precio.toFixed(2)}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}>-</Button>
                    <Badge bg="secondary">{item.cantidad}</Badge>
                    <Button variant="outline-secondary" size="sm" onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}>+</Button>
                  </div>
                </td>
                <td className="text-success fw-bold">${(item.precio * item.cantidad).toFixed(2)}</td>
                <td>
                  <Button variant="link" className="text-danger" size="sm" onClick={() => removeItem(item.producto_id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="d-flex justify-content-between align-items-center">
          <Button variant="outline-danger" size="sm" onClick={clearCart}>Vaciar carrito</Button>
          <div className="text-end">
            <div className="fs-4 mb-2">Total: <span className="text-success fw-bold">${total.toFixed(2)}</span></div>
            <Button variant="success" onClick={() => navigate('/checkout')}>Proceder al pago</Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
