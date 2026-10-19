# Especificaciones del Proyecto y Guía de Implementación

**Proyecto:** Tienda Web de Productos Frescos con Verificación Telefónica (Voice 2FA)  
**Modelo:** Monomarca / Un solo Vendedor  
**Versión:** 1.0  

---

## 1. Visión General del Sistema

El sistema consiste en una plataforma e-commerce orientada a la venta de productos frescos (frutas y verduras) operada por un único vendedor. Para prevenir fraudes en las compras y asegurar que las transacciones sean autorizadas por el titular del teléfono registrado, el sistema integra un bot de voz (Voice 2FA) a través de Twilio.

Al confirmar una orden, el sistema realiza una llamada automatizada al cliente. Mediante el teclado telefónico (DTMF), el usuario autoriza (presionando 1) o cancela/reporta (presionando 2) el pedido en tiempo real.

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
    -- Estados: PENDIENTE_VERIFICACION, CONFIRMADO, CANCELADO_FRAUDE, NO_CONTESTO, DESPACHADO
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

-- Historial y Registro del Bot de Voz (Auditoría)
CREATE TABLE registros_llamadas (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    telefono_destino VARCHAR(20) NOT NULL,
    estado_llamada VARCHAR(30), -- 'INICIADA', 'COMPLETADA', 'FALLIDA', 'SIN_RESPUESTA'
    respuesta_dtmf VARCHAR(5), -- '1', '2' o NULL
    intentos INT DEFAULT 1,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

### D. Webhooks y Bot de Voz (Twilio Integración)
* `POST /api/webhooks/twilio/outbound`: Retorna el XML (TwiML) con el mensaje de voz inicial y solicita lectura de teclado DTMF:
  > *"Gracias por su compra en Frutería Web. Para autorizar su pedido presione 1. Para reportar una compra no autorizada presione 2."*
* `POST /api/webhooks/twilio/response`: Procesa la tecla digitada por el usuario:
  * **Opción 1:** Actualiza estado del pedido a `CONFIRMADO` y actualiza stock.
  * **Opción 2:** Actualiza estado a `CANCELADO_FRAUDE` y emite alerta de seguridad.
  * **Sin respuesta/Error:** Dispara política de reintentos (hasta 3 intentos).

---

## 5. Indicaciones para el Desarrollo Paso a Paso

### Paso 1: Configuración del Entorno Backend
1. Inicializar proyecto Node.js (`npm init -y`).
2. Instalar dependencias base: `express`, `pg`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`, `twilio`.
3. Configurar conexión a la base de datos PostgreSQL mediante un pool de conexiones (`pg.Pool`).

### Paso 2: Configuración de Twilio y Ngrok
1. Obtener credenciales de Twilio (`ACCOUNT_SID`, `AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
2. Ejecutar Ngrok localmente (`ngrok http 5000`) para exponer la API local.
3. Configurar la URL generada por Ngrok en la consola de Twilio para los Webhooks.

### Paso 3: Frontend en React
1. Configurar la aplicación React con Bootstrap 5 para el maquetado adaptativo.
2. Construir la vista de tienda pública con carrito de compras reactivo.
3. Implementar un modal o pantalla interactiva de "Verificación Telefónica en Curso" tras dar clic en pagar.
4. Implementar un panel simple de administración con tablas de inventario y monitoreo de llamadas/alertas de seguridad.

### Paso 4: Pruebas y Validación
1. Realizar flujo de compra completo registrando un número telefónico real.
2. Probar escenarios:
   * Marcar **1** en el teléfono $\rightarrow$ Verificar cambio a `CONFIRMADO`.
   * Marcar **2** en el teléfono $\rightarrow$ Verificar cambio a `CANCELADO_FRAUDE`.
   * No responder la llamada $\rightarrow$ Comprobar el reintento automático.