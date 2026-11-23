import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Card, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginSchema } from '../schemas/authSchemas';
import useAuth from '../hooks/useAuth';
import Alert from '../components/Alert';

export default function Login({ adminOnly = false }) {
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const { login, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setError(null);
    try {
      const user = adminOnly
        ? await loginAdmin(data.email, data.contrasenia)
        : await login(data.email, data.contrasenia);
      navigate(user.rol === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <Card className="shadow-sm">
          <Card.Body>
            <h4 className="mb-4 text-center">Iniciar sesión</h4>
            <Nav
              variant="tabs"
              fill
              activeKey={adminOnly ? 'admin' : 'cliente'}
              className="mb-4"
              aria-label="Tipo de cuenta"
            >
              <Nav.Item>
                <Nav.Link as={Link} to="/login" eventKey="cliente">
                  Cliente
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} to="/admin/login" eventKey="admin">
                  Vendedor
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <p className="text-muted text-center mb-4">
              {adminOnly
                ? 'Ingresa con la cuenta autorizada del vendedor.'
                : 'Ingresa con tu cuenta de cliente para comprar.'}
            </p>
            <Alert message={error} onClose={() => setError(null)} />
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" {...registerField('email')} isInvalid={!!errors.email} />
                <Form.Control.Feedback type="invalid">
                  {errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  {...registerField('contrasenia')}
                  isInvalid={!!errors.contrasenia}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.contrasenia?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="success" className="w-100">
                Ingresar
              </Button>
            </Form>
            {!adminOnly && (
              <p className="text-center mt-3 mb-0">
                ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
