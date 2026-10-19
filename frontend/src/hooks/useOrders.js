import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useOrders({ admin = false, estado = null } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = admin ? '/pedidos/admin' : '/pedidos/mis-pedidos';
      const params = admin && estado ? { estado } : {};
      const { data } = await api.get(url, { params });
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [admin, estado]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (payload) => {
    const { data } = await api.post('/pedidos', payload);
    return data;
  };

  const despachar = async (id) => {
    const { data } = await api.put(`/pedidos/${id}/despachar`);
    await fetchOrders();
    return data;
  };

  return { orders, loading, error, createOrder, despachar, refetch: fetchOrders };
}
