import { Alert as RBAlert } from 'react-bootstrap';

export default function Alert({ variant = 'danger', message, onClose }) {
  if (!message) return null;
  return (
    <RBAlert variant={variant} dismissible={!!onClose} onClose={onClose}>
      {message}
    </RBAlert>
  );
}
