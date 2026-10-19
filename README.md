# Tienda Web de Productos Frescos con Verificación Telefónica (Voice 2FA)

Plataforma e-commerce monomarca para venta de productos frescos (frutas y verduras)
que verifica cada pedido mediante una llamada automatizada de **Twilio**. El cliente
autoriza (tecla `1`) o reporta fraude (tecla `2`) usando el teclado telefónico (DTMF).

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + PostgreSQL (`pg`) |
| Frontend | Vite + React 18 + Bootstrap 5 + React Bootstrap |
| Auth | JWT + bcryptjs |
| Formularios | React Hook Form + Zod |
| Estado | Context API (Auth + Cart) |
| Voice 2FA | Twilio Voice + Ngrok |

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
- (Opcional) Cuenta de Twilio + Ngrok para el flujo Voice 2FA real

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
no hay problemas de CORS. Para Twilio, copia `.env.example` a `.env` en la raíz y
rellena las credenciales.

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
cp .env.example .env     # edita credenciales de PostgreSQL y Twilio
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

#### 4. Twilio + Ngrok (para Voice 2FA real)

```bash
ngrok http 5000
```

- Copia la URL de Ngrok en `backend/.env` → `WEBHOOK_BASE_URL` (o `.env` raíz si
  usas Docker Compose).
- En la consola de Twilio, configura la **Voice URL** del número como:
  `https://<tu-ngrok>/api/webhooks/twilio/outbound`

> Si no configuras Twilio, el resto del sistema (registro, catálogo, carrito,
> panel admin, historial) funciona igual. La llamada fallará silenciosamente y
> se registrará como `FALLIDA` en el log de auditoría.

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
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=http://localhost:5173
WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app
```

## API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registro de clientes |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/productos` | — | Productos activos |
| POST | `/api/productos` | Admin | Crear producto |
| PUT | `/api/productos/:id` | Admin | Editar producto |
| POST | `/api/pedidos` | Cliente | Crear pedido + dispara llamada |
| GET | `/api/pedidos/mis-pedidos` | Cliente | Historial del usuario |
| GET | `/api/pedidos/admin` | Admin | Todos los pedidos |
| PUT | `/api/pedidos/:id/despachar` | Admin | Marcar como despachado |
| GET | `/api/registros-llamadas` | Admin | Log de auditoría |
| POST | `/api/webhooks/twilio/outbound` | Twilio | Devuelve TwiML `<Gather>` |
| POST | `/api/webhooks/twilio/response` | Twilio | Procesa DTMF (1/2) |

## Flujo Voice 2FA

1. El cliente crea un pedido → estado `PENDIENTE_VERIFICACION`.
2. El backend inicia una llamada de Twilio al teléfono registrado.
3. El mensaje de voz pide presionar `1` (autorizar) o `2` (fraude).
4. `1` → pedido `CONFIRMADO` y se descuenta el stock.
   `2` → pedido `CANCELADO_FRAUDE` y se emite alerta de seguridad.
5. Sin respuesta → reintentos automáticos (máx. 3) → `NO_CONTESTO`.

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
