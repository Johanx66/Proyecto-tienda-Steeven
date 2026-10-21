import { Card, Button, Badge } from 'react-bootstrap';
import useCart from '../hooks/useCart';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const sinStock = product.stock <= 0;

  return (
    <Card className="h-100 shadow-sm">
      <Card.Img
        variant="top"
        className="product-card-img"
        src={product.imagen_url || 'https://via.placeholder.com/300x180?text=Fresco'}
        alt={product.nombre}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6">{product.nombre}</Card.Title>
        <Card.Text className="text-muted small flex-grow-1">
          {product.descripcion || 'Producto fresco de calidad'}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold text-success">${parseFloat(product.precio).toFixed(2)}</span>
          <Badge bg={sinStock ? 'danger' : 'success'}>
            {sinStock ? 'Agotado' : `Stock: ${product.stock}`}
          </Badge>
        </div>
        <Button variant="success" size="sm" disabled={sinStock} onClick={() => addItem(product)}>
          Agregar al carrito
        </Button>
      </Card.Body>
    </Card>
  );
}
