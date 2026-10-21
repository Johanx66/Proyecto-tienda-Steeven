# Tareas para GitHub Projects — Proyecto Tienda Steeven

Lista de tareas, funcionalidades y correcciones realizadas hasta el momento, formateadas para GitHub Projects.
Campos sugeridos: **Type**, **Épica**, **Prioridad**, **Estado**.

> Importable a GitHub Projects con el archivo `github-projects-tasks.csv` (Projects → Add items → Import from CSV).

---

## Épica A — Arquitectura base y entorno

1. **Configurar arquitectura monorepo (backend Express + frontend React/Vite) con scripts de desarrollo** — _Tarea técnica_ · Prioridad Alta · Estado: Done
   Inicializar backend Node/Express (express, pg, dotenv, cors, jsonwebtoken, bcryptjs) y frontend Vite+React 18+Bootstrap 5. Script raíz con `concurrently`.
2. **Contenerizar el sistema completo (PostgreSQL + backend + frontend/Nginx) con Docker Compose** — _Tarea técnica_ · Alta · Done
   `docker-compose` con postgres, backend y frontend; auto-inicialización del esquema y seed vía `docker-entrypoint-initdb.d`.
3. **Definir modelo de datos PostgreSQL (`usuarios`, `productos`, `pedidos`, `detalle_pedidos`)** — _Tarea técnica_ · Alta · Done
   `schema.sql`, `init.sql` y `seed.sql` con 10 productos y usuarios ADMIN/CLIENTE de ejemplo.

## Épica B — Autenticación y usuarios

4. **Implementar registro y login de usuarios con JWT** — _Historia de usuario_ · Alta · Done
   `POST /api/auth/register` y `/api/auth/login`. Hash con bcryptjs y generación/validación de JWT.
5. **Proteger rutas con middlewares `auth`, `adminOnly`, `errorHandler` y validación** — _Tarea técnica_ · Alta · Done
   Autorización por rol y manejo centralizado de errores.

## Épica C — Catálogo y carrito

6. **Construir catálogo de productos y carrito de compras reactivo** — _Historia de usuario_ · Alta · Done
   Vista de tienda con productos activos, Context API de carrito y CartDrawer.
7. **Implementar panel de administración de productos (CRUD)** — _Historia de usuario_ · Media · Done
   Crear y editar productos: precio, descripción, stock y estado activo.

## Épica D — Pedidos y checkout

8. **Crear pedidos transaccionales en `PENDIENTE_VERIFICACION` desde el checkout** — _Historia de usuario_ · Alta · Done
   `POST /api/pedidos` crea el pedido con detalle y descuenta stock al confirmar. Historial en `/api/pedidos/mis-pedidos`.
9. **Gestionar pedidos desde el panel admin con filtro por estado y despacho** — _Historia de usuario_ · Media · Done
   `GET /api/pedidos/admin`, filtro por estado y `PUT /api/pedidos/:id/despachar` con alertas de seguridad.

## Épica E — Confirmación de pedidos (núcleo antifraude)

10. **Enviar correo de confirmación con enlaces Autorizar / Reportar fraude** — _Historia de usuario_ · Alta · Done
    Servicio Nodemailer con SMTP y modo `MAIL_MOCK`. Enlaces únicos con acciones approve/reject.
11. **Gestionar tokens de verificación con expiración (TTL configurable)** — _Tarea técnica_ · Alta · Done
    Tabla `verificaciones_pedido` y modelo `OrderVerification` (PENDIENTE, APROBADO, RECHAZADO, EXPIRADO).
12. **Procesar enlace de correo en `GET /api/orders/confirm` con página informativa** — _Tarea técnica_ · Alta · Done
    Aprobar → `CONFIRMADO` con descuento de stock; Rechazar → `CANCELADO_FRAUDE`. Manejo de token usado/expirado/inválido.
13. **Mostrar modal "Confirmación por Correo en Curso" con estado en tiempo real** — _Historia de usuario_ · Media · Done
    `VerificationModal` consulta el estado del pedido hasta confirmar o cancelar.

## Épica F — Migración y correcciones

14. **Migrar verificación de llamada telefónica (Twilio) a correo electrónico** — _Tarea técnica_ · Alta · Done
    Eliminar `twilioService`, `webhookController`, `CallLog`, rutas de webhooks y `AdminCallLogs`.
15. **Renombrar estado de pedido `NO_CONTESTO` a `NO_CONFIRMADO`** — _Tarea técnica_ · Media · Done
    Actualizar constantes, seed, badges y textos en frontend y backend.
16. **Actualizar README, `.env.example`, especificaciones y variables Docker al flujo por correo** — _Tarea técnica_ · Media · Done
    Documentar SMTP, `MAIL_MOCK`, `VERIFICATION_TOKEN_TTL_MINUTES` y enlaces de confirmación.
17. **Unificar rutas de la API de confirmación (`/api/orders/confirm` vs `/api/pedidos`)** — _Bug_ · Media · Todo
    Inconsistencia de prefijos de ruta que debe unificarse.
18. **Actualizar diagrama de navegación en especificaciones (aún muestra "Modal de Llamada en Cursos")** — _Bug_ · Baja · Todo
    Alinear el diagrama del documento con el flujo actual por correo.
