# Pruebas manuales y verificaciones de entrega

**Proyecto:** Tienda Web de Productos Frescos
**Última verificación:** 22 de noviembre de 2026
**Aplicación:** <https://proyectosteeven.dpdns.org>

## Verificaciones ejecutadas

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Página pública | Aprobada | `GET /` devolvió HTTP 200. |
| Salud de la API | Aprobada | `GET /api/health` devolvió HTTP 200 y `{"status":"ok"}`. |
| Catálogo público | Aprobada | `GET /api/productos` devolvió HTTP 200 con contenido. |
| Rechazo de credenciales inválidas | Aprobada | `POST /api/auth/login` con un correo inexistente y contraseña inválida devolvió HTTP 401. No se creó ni modificó una cuenta. |
| Ruta protegida de notificaciones | Aprobada | `GET /api/notificaciones` sin token devolvió HTTP 401. |
| Archivos de PWA | Aprobada | `GET /manifest.webmanifest`, `GET /sw.js` y `GET /hoja.svg` devolvieron HTTP 200. |
| ESLint backend y frontend | Aprobada | `npm run lint --prefix backend` y `npm run lint --prefix frontend`. |
| Prettier backend y frontend | Aprobada | `npm run format:check --prefix backend` y `npm run format:check --prefix frontend`. |
| Build de producción frontend | Aprobada | `npm run build --prefix frontend`; Vite generó `frontend/dist`. |

La primera ejecución del build chocó con un bloqueo temporal de OneDrive al copiar
un archivo público. Se repitió en serie y terminó correctamente.

## Casos de aceptación para la demostración

Ejecutar con una cuenta de prueba y en un entorno donde se pueda consultar la
base de datos. No registrar cuentas ficticias ni hacer pedidos de prueba en la
producción sin acordar antes cómo retirarlos.

| ID | Pasos | Resultado esperado | Estado |
|---|---|---|---|
| T-01 | Abrir la tienda y cargar el catálogo. | La tienda muestra productos activos y precios. | Verificado en producción. |
| T-02 | Iniciar sesión con credenciales válidas. | Se inicia sesión y se muestra la cuenta del cliente. | Pendiente de ejecutar con cuenta de prueba. |
| T-03 | Iniciar sesión con credenciales incorrectas. | La API rechaza el acceso con HTTP 401 y no revela si el correo existe. | Verificado en producción. |
| T-04 | Añadir un producto al carrito y enviar un pedido. | Se crea un pedido `PENDIENTE_VERIFICACION` y el cliente ve la confirmación del envío. | Pendiente de ejecutar con cuenta de prueba. |
| T-05 | Aprobar el enlace de confirmación del pedido. | El pedido pasa a `CONFIRMADO`, el stock se descuenta una sola vez y se registra el aviso interno. | Pendiente de ejecutar con cuenta de prueba. |
| T-06 | Abrir de nuevo el enlace ya utilizado. | El sistema informa que el enlace ya fue procesado y no vuelve a descontar stock. | Pendiente de ejecutar con cuenta de prueba. |
| T-07 | Usar el enlace para reportar fraude en un pedido de prueba. | El pedido pasa a `CANCELADO_FRAUDE` y el sistema muestra el mensaje de cancelación. | Pendiente de ejecutar con cuenta de prueba. |
| T-08 | Entrar al panel administrador y despachar un pedido confirmado. | El pedido cambia a `DESPACHADO`; un pedido sin confirmar no se puede despachar. | Pendiente de ejecutar con cuenta de prueba. |
| T-09 | Activar/desactivar Telegram o push desde el perfil. | Se guarda la preferencia; la bandeja interna sigue disponible aunque no se configuren canales externos. | Pendiente de ejecutar; canales opcionales. |
| T-10 | Reiniciar los contenedores sin borrar volúmenes. | Usuarios, productos y pedidos siguen en PostgreSQL. | Pendiente de ejecutar con Docker. |
| T-11 | Entrar a `/admin/login` con una cuenta de cliente y luego con el administrador. Desde Productos de la tienda, agregar un producto. | La cuenta cliente no recibe sesión de administrador; el administrador accede al panel y el producto aparece en el catálogo. | Pendiente de ejecutar con las cuentas de prueba. |

La cuenta de administrador local se inicializa con el comando `admin:create`;
cuando `ADMIN_PASSWORD` queda vacío, genera y muestra una clave única una sola
vez. Consulta el README para los pasos completos.

## Limitación del entorno de verificación

No se pudo ejecutar una prueba local de extremo a extremo contra PostgreSQL porque
Docker Desktop no estaba iniciado en el equipo de verificación. La aplicación
pública y las rutas de solo lectura sí respondieron; el registro exitoso, el
pedido y la persistencia requieren una cuenta de prueba y una base disponible.
