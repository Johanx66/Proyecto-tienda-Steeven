import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" role="status" variant="success" />
      <span className="mt-2 text-muted">{message}</span>
    </div>
  );
}
