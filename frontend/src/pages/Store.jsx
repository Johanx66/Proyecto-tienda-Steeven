import { useState } from 'react';
import { Row, Col, Form, Button, Badge } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import CartDrawer from '../components/CartDrawer';
import useProducts from '../hooks/useProducts';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

export default function Store() {
  const { products, loading, error } = useProducts();
  const { count } = useCart();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);

  const filtered = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Cargando productos frescos..." />;

  return (
    <>
      <div className="hero-section text-center mb-4">
        <h1 className="fw-bold">Productos Frescos a tu Puerta</h1>
        <p className="mb-0">Frutas y verduras de la mejor calidad, con verificación segura de tu compra.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Catálogo</h4>
        <div className="d-flex gap-2 align-items-center">
          <Form.Control
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 250 }}
          />
          {isAuthenticated && (
            <Button variant="outline-success" onClick={() => setShowCart(true)} className="position-relative">
              🛒 Carrito
              {count > 0 && (
                <Badge bg="danger" className="cart-badge rounded-pill">{count}</Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      <Alert message={error} />

      {filtered.length === 0 ? (
        <p className="text-muted text-center py-5">No se encontraron productos.</p>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filtered.map((product) => (
            <Col key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}

      <CartDrawer show={showCart} onHide={() => setShowCart(false)} />
    </>
  );
}
