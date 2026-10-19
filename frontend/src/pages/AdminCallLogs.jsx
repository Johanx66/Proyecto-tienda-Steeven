import { useState, useEffect } from 'react';
import { Table, Badge } from 'react-bootstrap';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const CALL_ESTADO_VARIANTS = {
  INICIADA: 'warning',
  COMPLETADA: 'success',
  FALLIDA: 'danger',
  SIN_RESPUESTA: 'secondary',
};

export default function AdminCallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/registros-llamadas');
        setLogs(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar registros');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando registros de llamadas..." />;

  const fraudes = logs.filter((l) => l.respuesta_dtmf === '2');

  return (
    <>
      <h5 className="mb-3">Log de Auditoría de Llamadas</h5>
      <Alert message={error} />
      {fraudes.length > 0 && (
        <Alert
          variant="warning"
          message={`⚠️ ${fraudes.length} alerta(s) de seguridad: se reportaron compras no autorizadas.`}
        />
      )}
      <Table responsive hover align="middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Estado llamada</th>
            <th>DTMF</th>
            <th>Intentos</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className={log.respuesta_dtmf === '2' ? 'table-danger' : ''}>
              <td>{log.id}</td>
              <td>{log.pedido_id}</td>
              <td>{log.cliente_nombre}</td>
              <td>{log.telefono_destino}</td>
              <td>
                <Badge bg={CALL_ESTADO_VARIANTS[log.estado_llamada] || 'secondary'} className="status-badge">
                  {log.estado_llamada}
                </Badge>
              </td>
              <td>
                {log.respuesta_dtmf === '1' && <Badge bg="success">Autorizó (1)</Badge>}
                {log.respuesta_dtmf === '2' && <Badge bg="danger">Fraude (2)</Badge>}
                {!log.respuesta_dtmf && <span className="text-muted">—</span>}
              </td>
              <td>{log.intentos}</td>
              <td>{new Date(log.fecha_hora).toLocaleString('es-MX')}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {logs.length === 0 && <p className="text-muted text-center py-4">No hay registros de llamadas.</p>}
    </>
  );
}
