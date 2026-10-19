import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerSchema } from '../schemas/authSchemas';
import useAuth from '../hooks/useAuth';
import Alert from '../components/Alert';

export default function Register() {
  const { register: registerField, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const onSubmit = async ({ confirmar, ...payload }) => {
    setError(null);
    try {
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <Card className="shadow-sm">
          <Card.Body>
            <h4 className="mb-4 text-center">Crear cuenta</h4>
            <Alert message={error} onClose={() => setError(null)} />
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre completo</Form.Label>
                <Form.Control {...registerField('nombre')} isInvalid={!!errors.nombre} />
                <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" {...registerField('email')} isInvalid={!!errors.email} />
                <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono (con código de país)</Form.Label>
                <Form.Control placeholder="+521234567890" {...registerField('telefono')} isInvalid={!!errors.telefono} />
                <Form.Control.Feedback type="invalid">{errors.telefono?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control type="password" {...registerField('contrasenia')} isInvalid={!!errors.contrasenia} />
                <Form.Control.Feedback type="invalid">{errors.contrasenia?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirmar contraseña</Form.Label>
                <Form.Control type="password" {...registerField('confirmar')} isInvalid={!!errors.confirmar} />
                <Form.Control.Feedback type="invalid">{errors.confirmar?.message}</Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="success" className="w-100">Registrarme</Button>
            </Form>
            <p className="text-center mt-3 mb-0">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
