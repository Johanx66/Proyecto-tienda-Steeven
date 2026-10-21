# Tienda Web de Productos Frescos con Confirmación por Correo

Plataforma e-commerce monomarca para venta de productos frescos (frutas y verduras)
que confirma cada pedido mediante un enlace enviado por **correo electrónico**. El
cliente autoriza su compra o reporta fraude con un clic desde el email.

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
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 (postgres / postgres) |

El frontend servido por Nginx hace *proxy* de `/api` hacia el backend, por lo que
no hay problemas de CORS. Para el envío de correos, copia `.env.example` a `.env`
en la raíz y rellena las credenciales SMTP (o deja `MAIL_MOCK=true`).

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

Esto crea la base `tienda_frescos` con las tablas y datos de prueba.
Credenciales del contenedor: usuario `postgres`, contraseña `postgres`, puerto `5432`.

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

## Flujo de Confirmación por Correo

1. El cliente crea un pedido → estado `PENDIENTE_VERIFICACION`.
2. El backend genera un token y envía un correo al cliente con dos enlaces.
3. El enlace **Autorizar** → pedido `CONFIRMADO` y se descuenta el stock.
   El enlace **No reconozco esta compra** → pedido `CANCELADO_FRAUDE` y alerta de seguridad.
4. Si el enlace expira sin usarse → el pedido queda en `PENDIENTE_VERIFICACION`
   (puede marcarse como `NO_CONFIRMADO`).

## Datos de ejemplo (seed)

Al cargar `backend/database/seed.sql` se crean estos usuarios y 10 productos:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| ADMIN | `admin@fruteria.com` | `admin123` |
| CLIENTE | `cliente@fruteria.com` | `cliente123` |

## Crear un administrador

Regístrate normalmente y luego actualiza el rol en la base de datos:

```sql
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'tu@email.com';
```
