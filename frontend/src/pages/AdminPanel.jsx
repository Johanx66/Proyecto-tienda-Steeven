import { useState } from 'react';
import { Nav, Card } from 'react-bootstrap';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';

export default function AdminPanel() {
  const [tab, setTab] = useState('pedidos');

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h4 className="mb-4">Panel de Administración</h4>
        <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k)} className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="pedidos">Pedidos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="productos">Inventario</Nav.Link>
          </Nav.Item>
        </Nav>

        {tab === 'pedidos' && <AdminOrders />}
        {tab === 'productos' && <AdminProducts />}
      </Card.Body>
    </Card>
  );
}
