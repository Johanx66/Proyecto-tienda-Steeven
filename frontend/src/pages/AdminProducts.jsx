import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { productSchema } from '../schemas/productSchemas';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/productos');
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '' });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    reset({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio,
      stock: product.stock,
      imagen_url: product.imagen_url || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setError(null);
    try {
      const payload = {
        ...data,
        precio: parseFloat(data.precio),
        stock: parseInt(data.stock, 10),
      };
      if (editing) {
        await api.put(`/productos/${editing.id}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar producto');
    }
  };

  const toggleActivo = async (product) => {
    try {
      await api.put(`/productos/${product.id}`, { activo: !product.activo });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Gestión de Stock</h5>
        <Button variant="success" size="sm" onClick={openCreate}>
          + Nuevo producto
        </Button>
      </div>
      <Alert message={error} onClose={() => setError(null)} />
      <Table responsive hover align="middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>${parseFloat(p.precio).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                <Badge bg={p.activo ? 'success' : 'secondary'}>
                  {p.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => openEdit(p)}>
                  Editar
                </Button>
                <Button
                  variant={p.activo ? 'outline-danger' : 'outline-success'}
                  size="sm"
                  onClick={() => toggleActivo(p)}
                >
                  {p.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>{editing ? 'Editar producto' : 'Nuevo producto'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control {...register('nombre')} isInvalid={!!errors.nombre} />
              <Form.Control.Feedback type="invalid">{errors.nombre?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" rows={2} {...register('descripcion')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                {...register('precio')}
                isInvalid={!!errors.precio}
              />
              <Form.Control.Feedback type="invalid">{errors.precio?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control type="number" {...register('stock')} isInvalid={!!errors.stock} />
              <Form.Control.Feedback type="invalid">{errors.stock?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL de imagen</Form.Label>
              <Form.Control {...register('imagen_url')} isInvalid={!!errors.imagen_url} />
              <Form.Control.Feedback type="invalid">
                {errors.imagen_url?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="success">
              Guardar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
