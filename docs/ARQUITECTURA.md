# Documento de Arquitectura — Tienda Steeven

**Proyecto:** Tienda Web de Productos Frescos con Confirmación por Correo Electrónico
**Última actualización:** 2026

Este documento describe la arquitectura de software del sistema: contexto, componentes,
tecnologías y decisiones de diseño. Complementa el diagrama de clases UML en
[`DIAGRAMA_CLASES_UML.md`](DIAGRAMA_CLASES_UML.md).

---

## 1. Visión general

Plataforma e-commerce **monomarca** para venta de productos frescos. El sistema previene
fraudes confirmando cada pedido mediante un **enlace único enviado por correo electrónico**:
el cliente autoriza la compra o reporta fraude desde su bandeja de entrada.

---

## 2. Estilo arquitectónico

Arquitectura **cliente-servidor en capas** (Layered Architecture):

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (SPA React)                                     │
│  Pages → Components → Hooks/Contexts → services/api.js    │
└───────────────────────────┬──────────────────────────────┘
                            │ REST (JSON) sobre /api
┌───────────────────────────▼──────────────────────────────┐
│  Backend (Node.js / Express)                              │
│  Routes → Middlewares → Controllers → Services → Models   │
└───────────────────────────┬──────────────────────────────┘
              ┌─────────────┴─────────────┐
              ▼                           ▼
      ┌──────────────┐            ┌────────────────┐
      │  PostgreSQL  │            │  SMTP (correo) │
      └──────────────┘            └────────────────┘
```

---

## 3. Componentes

### 3.1 Backend (`backend/src/`)

| Capa           | Responsabilidad                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| `routes/`      | Definición de endpoints y encadenado de middlewares.                               |
| `middleware/`  | `auth` (JWT), `adminOnly` (rol), `validation` (express-validator), `errorHandler`. |
| `controllers/` | Orquestación de peticiones y respuestas HTTP.                                      |
| `services/`    | Lógica de negocio: `orderService`, `emailService`.                                 |
| `models/`      | Acceso a datos con SQL parametrizado (User, Product, Order, OrderVerification).    |
| `config/`      | Conexiones y secretos: `db`, `jwt`, `mailer`.                                      |
| `utils/`       | Constantes de estados y helpers.                                                   |

### 3.2 Frontend (`frontend/src/`)

| Carpeta       | Responsabilidad                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| `pages/`      | Vistas de la aplicación (Store, Cart, Checkout, Login, Admin…).                 |
| `components/` | Componentes reutilizables (Navbar, CartDrawer, VerificationModal…).             |
| `contexts/`   | Estado global: `AuthContext`, `CartContext`.                                    |
| `hooks/`      | Lógica reutilizable de datos: `useAuth`, `useCart`, `useOrders`, `useProducts`. |
| `schemas/`    | Validación de formularios con Zod.                                              |
| `services/`   | Cliente HTTP (axios) con interceptores de token.                                |

---

## 4. Tecnologías

| Capa     | Tecnología                                                       |
| -------- | ---------------------------------------------------------------- |
| Backend  | Node.js, Express, PostgreSQL (`pg`), `express-validator`         |
| Auth     | JWT (`jsonwebtoken`) + `bcryptjs`                                |
| Correo   | Nodemailer (SMTP) con modo mock                                  |
| Frontend | Vite, React 18, Bootstrap 5, React Router, React Hook Form + Zod |
| Estado   | Context API                                                      |
| Infra    | Docker, Docker Compose, Nginx                                    |
| Calidad  | ESLint, Prettier, GitHub Actions                                 |

---

## 5. Modelo de datos

Cinco tablas: `usuarios`, `productos`, `pedidos`, `detalle_pedidos`, `verificaciones_pedido`.
Ver el diagrama de entidades en [`DIAGRAMA_CLASES_UML.md`](DIAGRAMA_CLASES_UML.md) (sección 2).

---

## 6. Flujo de confirmación de pedidos

```
Cliente            Backend                         PostgreSQL      Correo
   │  POST /api/pedidos  │                              │            │
   ├────────────────────>│  BEGIN; crear pedido         │            │
   │                     ├─────────────────────────────>│            │
   │                     │  COMMIT (PENDIENTE_VERIFICACION)          │
   │                     ├───────────────────────────────────────────>
   │                     │  generar token + enviar correo            │
   │  (< 201 Created)    │<──                                     (envío)
   │<────────────────────┤
   │  abre enlace del correo: GET /api/orders/confirm?token=..&action=approve
   ├────────────────────>│  valida token / expiración   │            │
   │                     │  aprueba → CONFIRMADO + descuenta stock   │
   │                     ├─────────────────────────────>│            │
   │  página HTML OK     │                              │            │
   │<────────────────────┤
```

Estados del pedido: `PENDIENTE_VERIFICACION → CONFIRMADO → DESPACHADO`,
con salidas a `CANCELADO_FRAUDE` (reporte) o `NO_CONFIRMADO` (token sin usar).

---

## 7. Decisiones de diseño (ADR resumidos)

| #   | Decisión                                                      | Justificación                                                 |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | **SQL parametrizado** en lugar de ORM                         | Simplicidad y control; previene inyección SQL.                |
| 2   | **Confirmación por correo** en vez de llamada telefónica      | Menor costo (sin Twilio), mayor accesibilidad y trazabilidad. |
| 3   | **Token aleatorio** (`crypto.randomBytes(32)`) con expiración | Suficientemente impredecible; TTL configurable evita reuso.   |
| 4   | **Transacciones** con `FOR UPDATE` al crear/confirmar pedidos | Garantiza consistencia de stock en concurrencia.              |
| 5   | **Context API** en lugar de Redux                             | Estado global acotado (auth + carrito); menor boilerplate.    |
| 6   | **Modo `MAIL_MOCK`**                                          | Permite desarrollo y pruebas sin credenciales SMTP.           |

---

## 8. Despliegue

- **Docker Compose**: `postgres` + `backend` + `frontend` (build + Nginx).
- El frontend servido por Nginx hace _proxy_ de `/api` al backend (sin problemas de CORS en prod).
- Healthcheck del backend: `GET /api/health`.

Ver `README.md` para los comandos de puesta en marcha.
