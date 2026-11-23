import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';

function decodeVapidKey(key) {
  const padding = '='.repeat((4 - (key.length % 4)) % 4);
  const raw = window.atob((key + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function NotificationSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [pushDeviceSubscribed, setPushDeviceSubscribed] = useState(false);

  const load = useCallback(async () => {
    const response = await api.get('/notificaciones');
    setData(response.data);
    if ('serviceWorker' in window.navigator && 'PushManager' in window) {
      const registration = await window.navigator.serviceWorker.getRegistration('/');
      const subscription = registration?.pushManager
        ? await registration.pushManager.getSubscription()
        : null;
      setPushDeviceSubscribed(Boolean(subscription));
    }
  }, []);

  useEffect(() => {
    load()
      .catch(() => setError('No se pudieron cargar las preferencias de notificación.'))
      .finally(() => setLoading(false));
  }, [load]);

  const updateTelegram = async (enabled) => {
    setBusy('telegram');
    setError('');
    setNotice('');
    try {
      const { data: response } = await api.put('/notificaciones/preferences', {
        telegramEnabled: enabled,
      });
      setData((current) => ({ ...current, preferences: response.preferences }));
      setNotice(enabled ? 'Avisos de Telegram activados.' : 'Avisos de Telegram desactivados.');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar Telegram.');
    } finally {
      setBusy('');
    }
  };

  const connectTelegram = async () => {
    setBusy('telegram-link');
    setError('');
    try {
      const { data: response } = await api.post('/notificaciones/telegram/link');
      setTelegramUrl(response.url);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo generar el enlace de Telegram.');
    } finally {
      setBusy('');
    }
  };

  const disconnectTelegram = async () => {
    setBusy('telegram-link');
    setError('');
    try {
      await api.delete('/notificaciones/telegram/link');
      setTelegramUrl('');
      await load();
      setNotice('Telegram se desvinculó de tu cuenta.');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo desvincular Telegram.');
    } finally {
      setBusy('');
    }
  };

  const togglePush = async (enabled) => {
    setBusy('push');
    setError('');
    setNotice('');
    try {
      if (!enabled) {
        const registration =
          'serviceWorker' in window.navigator
            ? await window.navigator.serviceWorker.getRegistration('/')
            : null;
        const subscription = registration?.pushManager
          ? await registration.pushManager.getSubscription()
          : null;
        await api.delete('/notificaciones/push/subscription');
        if (subscription) await subscription.unsubscribe();
        setPushDeviceSubscribed(false);
        await load();
        setNotice('Avisos push desactivados en tu cuenta.');
        return;
      }

      if (!('serviceWorker' in window.navigator) || !('PushManager' in window)) {
        throw new Error('Este navegador no admite notificaciones push web.');
      }
      if (!data?.integrations?.pushAvailable || !data.integrations.vapidPublicKey) {
        throw new Error('Las notificaciones push aún no están configuradas en el servidor.');
      }
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted')
        throw new Error('Debes permitir las notificaciones en el navegador.');

      const registration = await window.navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(data.integrations.vapidPublicKey),
        });
      }
      await api.post('/notificaciones/push/subscription', subscription.toJSON());
      setPushDeviceSubscribed(true);
      await load();
      setNotice('Avisos push activados en este dispositivo.');
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'No se pudieron activar los avisos push.'
      );
    } finally {
      setBusy('');
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/read`);
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === id ? { ...item, leida_en: item.leida_en || new Date().toISOString() } : item
        ),
      }));
    } catch {
      setError('No se pudo marcar la notificación como leída.');
    }
  };

  if (!data && loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <Alert variant="danger">{error}</Alert>
          <Button variant="outline-success" onClick={() => load().catch(() => {})}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const preferences = data.preferences;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <h3 className="mb-3">Perfil y notificaciones</h3>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert variant="success" onClose={() => setNotice('')} dismissible>
            {notice}
          </Alert>
        )}

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <h5>Correo electrónico</h5>
            {data.integrations.emailMode === 'mock' ? (
              <Alert variant="warning" className="mb-0">
                El servidor está en modo de prueba y no envía correos. El administrador debe poner
                <code> MAIL_MOCK=false </code> y configurar las credenciales SMTP en el servidor.
              </Alert>
            ) : !data.integrations.emailAvailable ? (
              <Alert variant="danger" className="mb-0">
                Falta configurar en el servidor:{' '}
                {data.integrations.emailMissingSettings.map((name) => (
                  <code key={name} className="me-1">
                    {name}
                  </code>
                ))}
              </Alert>
            ) : (
              <Alert variant="success" className="mb-0">
                Las variables SMTP están configuradas. Si el correo no aparece, revisa también spam
                y los registros del backend.
              </Alert>
            )}
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between gap-3 align-items-start">
              <div>
                <h5>Telegram</h5>
                <p className="text-muted mb-2">
                  Recibe un mensaje cuando tu pedido quede confirmado. Primero debes iniciar el bot
                  para vincular tu cuenta.
                </p>
                <div className="mb-3">
                  {preferences.telegram_vinculado ? (
                    <Badge bg="success">Cuenta vinculada</Badge>
                  ) : (
                    <Badge bg="secondary">Cuenta sin vincular</Badge>
                  )}
                </div>
                {!preferences.telegram_vinculado && data.integrations.telegramAvailable && (
                  <div className="d-flex flex-wrap gap-2">
                    <Button variant="outline-primary" onClick={connectTelegram} disabled={!!busy}>
                      {busy === 'telegram-link' ? 'Generando enlace…' : 'Vincular Telegram'}
                    </Button>
                    {telegramUrl && (
                      <>
                        <Button as="a" href={telegramUrl} target="_blank" rel="noreferrer">
                          Abrir Telegram
                        </Button>
                        <Button variant="outline-success" onClick={() => load()} disabled={!!busy}>
                          Ya inicié el bot — actualizar
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {preferences.telegram_vinculado && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={disconnectTelegram}
                    disabled={!!busy}
                  >
                    Desvincular Telegram
                  </Button>
                )}
                {!data.integrations.telegramAvailable && (
                  <Alert variant="warning" className="mb-0">
                    El administrador debe configurar:{' '}
                    {data.integrations.telegramMissingSettings.map((name) => (
                      <code key={name} className="me-1">
                        {name}
                      </code>
                    ))}
                    . Después debe registrar el webhook del bot en el servidor.
                  </Alert>
                )}
                {!preferences.telegram_vinculado && data.integrations.telegramAvailable && (
                  <small className="d-block text-muted">
                    Si el bot no responde al vincular, el administrador debe ejecutar{' '}
                    <code>docker compose exec backend npm run telegram:webhook</code> en el
                    servidor.
                  </small>
                )}
              </div>
              <Form.Check
                type="switch"
                id="telegram-notifications"
                label="Avisos"
                checked={preferences.telegram_habilitado}
                disabled={
                  !!busy || !preferences.telegram_vinculado || !data.integrations.telegramAvailable
                }
                onChange={(event) => updateTelegram(event.target.checked)}
              />
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between gap-3 align-items-start">
              <div>
                <h5>Notificaciones push web</h5>
                <p className="text-muted mb-0">
                  Recibe una alerta cuando tu pedido quede confirmado. La preferencia aplica a la
                  cuenta; cada navegador debe suscribirse y puedes cambiar su permiso desde los
                  ajustes del navegador.
                </p>
                {preferences.push_habilitado &&
                  !pushDeviceSubscribed &&
                  'serviceWorker' in window.navigator &&
                  'PushManager' in window && (
                    <Button
                      className="mt-2"
                      variant="outline-success"
                      size="sm"
                      onClick={() => togglePush(true)}
                      disabled={!!busy}
                    >
                      Activar también en este navegador
                    </Button>
                  )}
                {!data.integrations.pushAvailable && (
                  <Alert variant="warning" className="mt-2 mb-0">
                    {data.integrations.pushMissingSettings.length > 0 ? (
                      <>
                        El administrador debe configurar:{' '}
                        {data.integrations.pushMissingSettings.map((name) => (
                          <code key={name} className="me-1">
                            {name}
                          </code>
                        ))}
                        .
                      </>
                    ) : (
                      data.integrations.pushConfigurationError ||
                      'La configuración de notificaciones web no es válida.'
                    )}{' '}
                    Después, permite las notificaciones en este navegador. Requiere HTTPS.
                  </Alert>
                )}
              </div>
              <Form.Check
                type="switch"
                id="push-notifications"
                label="Avisos"
                checked={preferences.push_habilitado}
                disabled={!!busy || !data.integrations.pushAvailable}
                onChange={(event) => togglePush(event.target.checked)}
              />
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Bandeja de notificaciones</h5>
            {data.notifications.length === 0 ? (
              <p className="text-muted mb-0">Aún no tienes notificaciones.</p>
            ) : (
              <div className="list-group list-group-flush">
                {data.notifications.map((item) => (
                  <div
                    className={`list-group-item px-0 ${item.leida_en ? '' : 'bg-light'}`}
                    key={item.id}
                  >
                    <div className="d-flex justify-content-between gap-3">
                      <div>
                        <strong>{item.titulo}</strong>
                        <p className="mb-1">{item.mensaje}</p>
                        <small className="text-muted">
                          {new Date(item.fecha_creacion).toLocaleString('es-CO')}
                        </small>
                      </div>
                      {!item.leida_en && (
                        <Button variant="link" size="sm" onClick={() => markRead(item.id)}>
                          Marcar leída
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
