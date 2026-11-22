# Tienda Web de Productos Frescos con Confirmación por Correo

Plataforma e-commerce monomarca para venta de productos frescos (frutas y verduras)
que confirma cada pedido mediante un enlace enviado por **correo electrónico**. El
cliente autoriza su compra o reporta fraude con un clic desde el email.

## Enlaces de entrega

- **Aplicación desplegada:** https://proyectosteeven.dpdns.org
- **Repositorio:** https://github.com/Johanx66/Proyecto-tienda-Steeven
- **Wiki del proyecto:** https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki

La guía para instalar y ejecutar el proyecto desde cero está en esta página. La
arquitectura, los diagramas, el despliegue y la matriz de riesgos están en
[`docs/`](docs); la guía y resultados de las pruebas manuales están en
[`docs/PRUEBAS_MANUALES.md`](docs/PRUEBAS_MANUALES.md).

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + PostgreSQL (`pg`) |
| Frontend | Vite + React 18 + Bootstrap 5 + React Bootstrap |
| Auth | JWT + bcryptjs |
| Formularios | React Hook Form + Zod |
| Estado | Context API (Auth + Cart) |
| Confirmación | Enlace por correo con Nodemailer (SMTP) |

## Estructura

```
├── backend/          API REST Node.js/Express
│   ├── database/     schema.sql, init.sql y seed.sql
│   ├── Dockerfile    imagen del backend
│   └── src/          config, middleware, models, controllers, services, routes, utils
├── frontend/         SPA React (Vite)
│   ├── Dockerfile    build + Nginx
│   ├── nginx.conf    sirve la SPA y hace proxy de /api
│   └── src/          contexts, services, hooks, schemas, components, pages
├── Caddyfile         HTTPS automático y proxy público
├── docker-compose.yml  postgres + backend + frontend
└── package.json      scripts de conveniencia (concurrently)
```

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+ — **o** Docker + Docker Compose para levantar todo el stack
- (Opcional) Cuenta SMTP (p. ej. Gmail con contraseña de aplicación) para envío real de correos

## Puesta en marcha

### Opción rápida — Todo con Docker (recomendado)

Levanta PostgreSQL (con esquema + datos de ejemplo), el backend y el frontend
construido y servido con Nginx, todo con un solo comando:

```bash
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | accesible a través del proxy `/api` del frontend |
| PostgreSQL | solo accesible dentro de la red privada de Docker |

El frontend servido por Nginx hace *proxy* de `/api` hacia el backend, por lo que
no hay problemas de CORS. En el despliegue de producción, Caddy se activa con el
perfil `production`, termina HTTPS y redirige `www` al dominio principal. Para el
envío de correos, copia `.env.example` a `.env` en la raíz y rellena las
credenciales SMTP (o deja `MAIL_MOCK=true`).

Para reiniciar desde cero (borra los datos de la base):

```bash
docker compose down -v && docker compose up --build
```

### Opción manual (desarrollo con recarga en caliente)

#### 1. Base de datos

**Opción A — Docker solo para la BD (recomendado):**

```bash
docker compose up -d postgres
```

Esto crea la base `tienda_frescos` con las tablas y productos de ejemplo. La base
queda dentro de la red de Docker y no publica el puerto `5432`.

Para reiniciar desde cero (borra los datos):

```bash
docker compose down -v && docker compose up -d postgres
```

**Opción B — PostgreSQL local:** crea la BD y ejecuta el esquema y los datos.

```bash
psql -U postgres -f backend/database/init.sql          # crea BD + tablas
psql -U postgres -d tienda_frescos -f backend/database/seed.sql   # datos de ejemplo
```

#### 2. Backend

```bash
cd backend
cp .env.example .env     # edita credenciales de PostgreSQL y SMTP
npm install
npm run dev              # http://localhost:5000
```

#### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

#### 4. Correo electrónico (para confirmación real)

Por defecto el backend arranca con `MAIL_MOCK=true`: en lugar de enviar correos,
imprime en la consola el enlace de confirmación de cada pedido (útil para probar
sin configurar nada). Para enviar correos reales:

1. Usa una cuenta Gmail y genera una **contraseña de aplicación**
   (Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones).
2. En `backend/.env` (o `.env` raíz si usas Docker Compose) configura:

   ```
   MAIL_MOCK=false
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=tu_app_password
   MAIL_FROM=Frutería Web <tu_correo@gmail.com>
   ```

3. Ajusta `WEBHOOK_BASE_URL` a la URL pública desde la que se abrirá el enlace del
   correo (`http://localhost:5000` en local, o tu dominio/ngrok si pruebas desde
   otro dispositivo).

> Los enlaces del correo apuntan a `GET /api/orders/confirm?token=...&action=approve|reject`.

#### Ejecutar backend + frontend juntos (desde la raíz)

```bash
npm install
npm run dev
```

## Variables de entorno

**backend/.env**

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tienda_frescos
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=una_clave_secreta_larga
JWT_EXPIRES_IN=7d
MAIL_MOCK=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password
MAIL_FROM=Frutería Web <tu_correo@gmail.com>
VERIFICATION_TOKEN_TTL_MINUTES=30
FRONTEND_URL=http://localhost:5173
WEBHOOK_BASE_URL=http://localhost:5000
```

## API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registro de clientes |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/productos` | — | Productos activos |
| POST | `/api/productos` | Admin | Crear producto |
| PUT | `/api/productos/:id` | Admin | Editar producto |
| POST | `/api/pedidos` | Cliente | Crear pedido + enviar correo de confirmación |
| GET | `/api/pedidos/mis-pedidos` | Cliente | Historial del usuario |
| GET | `/api/pedidos/admin` | Admin | Todos los pedidos |
| PUT | `/api/pedidos/:id/despachar` | Admin | Marcar como despachado |
| GET | `/api/orders/confirm` | — | Enlace del correo: `?token=...&action=approve\|reject` |
| GET | `/api/notificaciones` | Cliente | Preferencias y últimas notificaciones |
| PUT | `/api/notificaciones/preferences` | Cliente | Activar/desactivar Telegram y push web |
| POST/DELETE | `/api/notificaciones/telegram/link` | Cliente | Vincular/desvincular Telegram |
| POST/DELETE | `/api/notificaciones/push/subscription` | Cliente | Activar/desactivar push web |
| PUT | `/api/notificaciones/:id/read` | Cliente | Marcar como leída una notificación propia |

## Flujo de Confirmación por Correo

1. El cliente crea un pedido → estado `PENDIENTE_VERIFICACION`.
2. El backend genera un token y envía un correo al cliente con dos enlaces.
3. El enlace **Autorizar** → pedido `CONFIRMADO` y se descuenta el stock.
   El enlace **No reconozco esta compra** → pedido `CANCELADO_FRAUDE` y alerta de seguridad.
4. Si el enlace expira sin usarse → el pedido queda en `PENDIENTE_VERIFICACION`
   (puede marcarse como `NO_CONFIRMADO`).

## Avisos de pedido (Telegram y push web)

La confirmación antifraude por correo se conserva. Después de que el cliente
aprueba el enlace y el pedido pasa a `CONFIRMADO`, el sistema guarda un aviso en
la bandeja del perfil y lo envía por Telegram y/o push web si el cliente activó
esos canales. Los avisos externos son opcionales; un fallo de Telegram o push no
deshace la confirmación del pedido.

Para activar Telegram, crea un bot con `@BotFather`, configura
`TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME` y registra el webhook de Telegram
con `WEBHOOK_BASE_URL=https://TU_DOMINIO` y un valor aleatorio para
`TELEGRAM_WEBHOOK_SECRET`. Después de desplegar el backend con HTTPS, registra el
webhook en Telegram con:

```bash
docker compose exec backend npm run telegram:webhook
```

El cliente genera un enlace de vinculación desde **Perfil y notificaciones** y
debe iniciar el bot.

Para push web, genera claves VAPID dentro del backend con
`npx web-push generate-vapid-keys` y configura `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`. El navegador solicita permiso cuando el
usuario activa push desde su perfil. En producción se requiere HTTPS; los avisos
push dependen del soporte del navegador y de sus permisos.

Las tablas nuevas se aplican automáticamente al arrancar el backend mediante las
migraciones de `backend/database/migrations/`.

## Datos de ejemplo (seed)

Al cargar `backend/database/seed.sql` se crean 10 productos de ejemplo. No se
crean usuarios con contraseñas conocidas.

## Crear un administrador

Regístrate normalmente y luego actualiza el rol en la base de datos:

```sql
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'tu@email.com';
```

## Documentación

- **Wiki del proyecto:** https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki
  - [Arquitectura](https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki/Arquitectura)
  - [Matriz de Riesgos](https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki/Matriz-de-Riesgos)
  - [Diagrama de clases UML](https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki/Diagrama-de-clases-UML)
  - [Guía de desarrollo](https://github.com/Johanx66/Proyecto-tienda-Steeven/wiki/Guia-de-desarrollo)
- **Tablero de tareas (GitHub Projects):** https://github.com/users/Johanx66/projects/4
- **Documentos locales:** [`docs/`](docs) — arquitectura, UML y matriz de riesgos.
- **Pruebas manuales:** [`docs/PRUEBAS_MANUALES.md`](docs/PRUEBAS_MANUALES.md) — casos de aceptación y verificaciones ejecutadas.
