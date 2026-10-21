# Especificaciones del Proyecto y Guía de Implementación

**Proyecto:** Tienda Web de Productos Frescos con Confirmación por Correo Electrónico  
**Modelo:** Monomarca / Un solo Vendedor  
**Versión:** 1.0  

---

## 1. Visión General del Sistema

El sistema consiste en una plataforma e-commerce orientada a la venta de productos frescos (frutas y verduras) operada por un único vendedor. Para prevenir fraudes en las compras y asegurar que las transacciones sean autorizadas por el titular de la cuenta, el sistema integra una confirmación por correo electrónico.

Al confirmar una orden, el sistema envía un correo al cliente con un enlace único. Al abrir el enlace, el usuario autoriza su pedido o reporta la compra no autorizada, actualizando el estado del pedido en tiempo real.

---

## 2. Arquitectura de Navegación y Modulos

El sistema se dividirá en tres áreas principales:

```
                  ┌──────────────────────────────────────────┐
                  │          Plataforma E-Commerce           │
                  └────────────────────┬─────────────────────┘
                                       │
      ┌────────────────────────────────┼────────────────────────────────┐
      ▼                                ▼                                ▼
┌───────────┐                  ┌───────────────┐               ┌─────────────────┐
│ Tienda    │                  │  Checkout &   │               │     Panel       │
│ Cliente   │                  │  Verificación │               │ Administrador   │
└─────┬─────┘                  └───────┬───────┘               └────────┬────────┘
      │                                │                                │
      ├─ Catálogo de Frutas            ├─ Formulario de Envío           ├─ Gestión Stock
      ├─ Carrito de Compras            ├─ Modal de Llamada en Cursos    ├─ Estado Pedidos
      └─ Historial de Compras          └─ Confirmación / Cancelación    └─ Log de Auditoría
```

---

## 3. Modelo de Datos (PostgreSQL)

```sql
-- Tabla de Usuarios (Clientes y Administrador)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    contrasenia VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'CLIENTE', -- 'CLIENTE' o 'ADMIN'
    direccion_envio TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos Frescos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    monto_total DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE_VERIFICACION', 
    -- Estados: PENDIENTE_VERIFICACION, CONFIRMADO, CANCELADO_FRAUDE, NO_CONFIRMADO, DESPACHADO
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detalle del Pedido
CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Tokens de confirmación por correo (Auditoría)
CREATE TABLE verificaciones_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    token VARCHAR(128) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'EXPIRADO'
    expira_en TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Endpoints Principales de la API (Node.js / Express)

### A. Autenticación y Usuarios
* `POST /api/auth/register`: Registro de clientes.
* `POST /api/auth/login`: Autenticación y generación de JWT.

### B. Catálogo de Productos
* `GET /api/productos`: Obtener lista de productos frescos activos.
* `POST /api/productos`: (Solo Admin) Crear un nuevo producto.
* `PUT /api/productos/:id`: (Solo Admin) Editar precio, descripción o stock.

### C. Compras y Pedidos
* `POST /api/pedidos`: Crear pedido con estado `PENDIENTE_VERIFICACION` y disparar el servicio de llamada en segundo plano.
* `GET /api/pedidos/mis-pedidos`: Historial de pedidos del cliente logueado.
* `GET /api/pedidos/admin`: (Solo Admin) Lista global de pedidos para gestión de despacho.

### D. Confirmación por Correo
* `POST /api/pedidos`: Genera un token único y envía por correo un enlace de confirmación con dos acciones:
  > *"Gracias por su compra en Frutería Web. Autorice su pedido o reporte una compra no autorizada."*
* `GET /api/orders/confirm?token=...&action=approve|reject`: Procesa la acción del cliente desde el correo:
  * **approve:** Actualiza estado del pedido a `CONFIRMADO` y actualiza stock.
  * **reject:** Actualiza estado a `CANCELADO_FRAUDE` y emite alerta de seguridad.
  * **Token expirado/ya usado:** Muestra una página informativa y no altera el pedido.

---

## 5. Indicaciones para el Desarrollo Paso a Paso

### Paso 1: Configuración del Entorno Backend
1. Inicializar proyecto Node.js (`npm init -y`).
2. Instalar dependencias base: `express`, `pg`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`, `nodemailer`.
3. Configurar conexión a la base de datos PostgreSQL mediante un pool de conexiones (`pg.Pool`).

### Paso 2: Configuración del Correo (SMTP)
1. Crear una cuenta SMTP (p. ej. Gmail) y generar una contraseña de aplicación.
2. Configurar las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM` en el backend.
3. Construir el enlace de confirmación usando `WEBHOOK_BASE_URL` apuntando a `/api/orders/confirm`.
4. Para desarrollo sin credenciales, usar `MAIL_MOCK=true` (imprime los enlaces en consola).

### Paso 3: Frontend en React
1. Configurar la aplicación React con Bootstrap 5 para el maquetado adaptativo.
2. Construir la vista de tienda pública con carrito de compras reactivo.
3. Implementar un modal o pantalla interactiva de "Confirmación por Correo en Curso" tras dar clic en pagar.
4. Implementar un panel simple de administración con tablas de inventario y alertas de seguridad.

### Paso 4: Pruebas y Validación
1. Realizar flujo de compra completo con un correo real (o `MAIL_MOCK=true`).
2. Probar escenarios:
   * Usar el enlace **Autorizar** $\rightarrow$ Verificar cambio a `CONFIRMADO`.
   * Usar el enlace **Reportar** $\rightarrow$ Verificar cambio a `CANCELADO_FRAUDE`.
   * Dejar el enlace sin usar $\rightarrow$ Comprobar la expiración del token.