import { Offcanvas, Button, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function CartDrawer({ show, onHide }) {
  const { items, updateQuantity, removeItem, total, count } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onHide();
    navigate('/checkout');
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Tu carrito ({count})</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {items.length === 0 ? (
          <p className="text-muted text-center my-auto">Tu carrito está vacío</p>
        ) : (
          <>
            <ListGroup variant="flush" className="flex-grow-1">
              {items.map((item) => (
                <ListGroup.Item key={item.producto_id}>
                  <div className="d-flex justify-content-between">
                    <strong>{item.nombre}</strong>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      size="sm"
                      onClick={() => removeItem(item.producto_id)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                      >
                        -
                      </Button>
                      <Badge bg="secondary">{item.cantidad}</Badge>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <span className="text-success fw-bold">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between mb-3 fs-5">
                <strong>Total:</strong>
                <strong className="text-success">${total.toFixed(2)}</strong>
              </div>
              <Button variant="success" className="w-100" onClick={handleCheckout}>
                Ir a pagar
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
