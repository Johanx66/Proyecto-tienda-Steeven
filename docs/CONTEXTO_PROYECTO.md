# Contexto del proyecto — Tienda Steeven

Guía breve para retomar el proyecto. Para detalles completos, consultar también
`README.md`, `docs/ARQUITECTURA.md`, `docs/DIAGRAMA_CLASES_UML.md` y
`docs/PRUEBAS_MANUALES.md`.

## Qué es

Tienda monomarca de frutas y verduras. La interfaz es una SPA en React y la API es
Node.js/Express con PostgreSQL. El stack se ejecuta con Docker Compose y se publica
en AWS EC2 detrás de Caddy y Nginx. Sitio: <https://proyectosteeven.dpdns.org>.

## Piezas principales

- `frontend/src/`: páginas, componentes, contextos y servicios de React.
- `backend/src/`: rutas, controladores, servicios y modelos de Express.
- `backend/database/`: esquema, datos de ejemplo y migraciones SQL.
- `docs/`: arquitectura, diagramas, despliegue, riesgos y pruebas.

## Flujo actual del pedido

1. Un cliente autenticado envía su carrito a `POST /api/pedidos`.
2. El backend crea el pedido como `PENDIENTE_VERIFICACION` y genera un token de
   un solo uso con vencimiento configurable.
3. `emailService` envía un correo con enlaces para autorizar la compra o reportar
   fraude. En desarrollo se puede usar `MAIL_MOCK=true`.
4. El enlace `GET /api/orders/confirm` valida la acción y el vencimiento. Al
   aprobar, el pedido pasa a `CONFIRMADO` y se actualiza el stock; luego puede
   despacharse.
5. Tras aprobar, se guarda un aviso en la bandeja interna y se envía por Telegram
   o Web Push solo si el cliente habilitó esos canales.

## Dónde mirar

- Creación del pedido: `backend/src/controllers/orderController.js`.
- Orquestación de la verificación: `backend/src/services/orderService.js`.
- Correo: `backend/src/services/emailService.js`.
- Aprobación/rechazo: `backend/src/controllers/orderVerificationController.js`.
- Avisos: `backend/src/controllers/notificationController.js`,
  `backend/src/services/notificationService.js` y
  `frontend/src/pages/NotificationSettings.jsx`.
- Interfaz de checkout: `frontend/src/pages/Checkout.jsx` y
  `frontend/src/components/VerificationModal.jsx`.
- Configuración: `backend/src/config/`, archivos `.env.example` y
  `docker-compose.yml`.

## Criterio de notificación

La confirmación por correo es el control antifraude del pedido. Telegram y Web
Push son avisos posteriores y opcionales; la bandeja interna conserva el
historial. Un fallo de estos canales externos no debe revertir la confirmación.

## Notas de mantenimiento

- No leer ni copiar secretos desde `.env`; usar `.env.example` para conocer los
  nombres de variables.
- La ruta de confirmación conserva `/api/orders/confirm`; las demás rutas de
  pedidos usan `/api/pedidos`.
- Al cambiar estados o modelos, sincronizar backend, frontend, base de datos,
  diagramas y Wiki.
- La guía de pruebas registra qué se verificó y qué flujos requieren una cuenta
  de prueba: `docs/PRUEBAS_MANUALES.md`.
