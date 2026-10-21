# Matriz de Riesgos — Proyecto Tienda Steeven

**Proyecto:** Tienda Web de Productos Frescos con Confirmación por Correo Electrónico
**Metodología:** Análisis cualitativo (Probabilidad × Impacto)
**Última revisión:** 2026

Este documento identifica los riesgos críticos del sistema y las estrategias de mitigación
aplicadas. Listo para copiar a la **Wiki de GitHub**.

---

## Escalas

**Probabilidad:** Baja · Media · Alta
**Impacto:** Bajo · Medio · Alto · Crítico
**Nivel de riesgo:** Probabilidad × Impacto → Bajo / Medio / Alto / Crítico

---

## 1. Matriz de riesgos

| ID   | Riesgo identificado                                                             | Categoría | Probabilidad | Impacto | Nivel | Estrategia de mitigación aplicada                                                                                                                          |
| ---- | ------------------------------------------------------------------------------- | --------- | ------------ | ------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01 | **Fuga de secretos** (JWT_SECRET, credenciales SMTP/DB) al repositorio          | Seguridad | Media        | Crítico | Alto  | `.gitignore` robusto ignora `.env` y `*.key`/`*.pem`; se usan `.env.example` sin valores reales; variables inyectadas por entorno en Docker Compose.       |
| R-02 | **Contraseñas en texto plano** en la base de datos                              | Seguridad | Baja         | Crítico | Alto  | Hashing con **bcryptjs** (salt rounds = 10) antes de persistir; `contrasenia` nunca se devuelve en respuestas (`safeUser`).                                |
| R-03 | **Falsificación/expiración de JWT** o uso de token robado                       | Seguridad | Media        | Alto    | Alto  | JWT firmado con secreto; verificación en `auth`; expiración configurable (`JWT_EXPIRES_IN=7d`); 401 limpia token en el frontend.                           |
| R-04 | **Reuso de token de confirmación** (doble aprobación de pedido)                 | Técnico   | Media        | Alto    | Alto  | Token de un solo uso: se valida `estado === PENDIENTE`; tras aprobar/rechazar pasa a `APROBADO`/`RECHAZADO` y responde 409 si se reusa.                    |
| R-05 | **Inyección SQL** en consultas a la base de datos                               | Seguridad | Baja         | Crítico | Medio | Uso exclusivo de **consultas parametrizadas** (`$1, $2…`) en todos los modelos; sin concatenación de input del usuario.                                    |
| R-06 | **Condiciones de carrera en el stock** (sobreventa de productos)                | Técnico   | Media        | Alto    | Alto  | Transacciones (`BEGIN`/`COMMIT`/`ROLLBACK`) + bloqueo `SELECT … FOR UPDATE` al crear el pedido; stock decrementado con verificación `stock >= cantidad`.   |
| R-07 | **Enlaces de confirmación expirados o no usados**                               | Técnico   | Alta         | Medio   | Medio | TTL configurable (`VERIFICATION_TOKEN_TTL_MINUTES=30`); estado `EXPIRADO` y página informativa; pedido permanece `PENDIENTE_VERIFICACION`/`NO_CONFIRMADO`. |
| R-08 | **Datos de entrada maliciosos / malformados** en la API                         | Seguridad | Media        | Medio   | Medio | Validación con **express-validator** (`registerRules`, `loginRules`, `productRules`, `orderRules`); validación de formularios en frontend con **Zod**.     |
| R-09 | **Dependencias desactualizadas o vulnerables**                                  | Técnico   | Media        | Medio   | Medio | `npm audit` = 0 vulnerabilidades; CI ejecuta `npm ci`; checklist de actualización periódica (ver sección 3).                                               |
| R-10 | **Errores no controlados** que filtren stack traces al cliente                  | Técnico   | Media        | Medio   | Medio | Middleware `errorHandler` centralizado; los controladores delegan con `next(err)` y responden JSON genérico.                                               |
| R-11 | **CORS mal configurado** / exposición de la API                                 | Seguridad | Baja         | Medio   | Bajo  | `cors` explícito; en producción el frontend (Nginx) hace _proxy_ de `/api`, evitando CORS abierto.                                                         |
| R-12 | **Pérdida de la base de datos**                                                 | Técnico   | Baja         | Crítico | Medio | Volumen persistente de Docker (`postgres_data`); esquema versionado en `schema.sql` + `seed.sql`; (recomendado) respaldos periódicos `pg_dump`.            |
| R-13 | **Fallo de envío de correo** (SMTP caído o credenciales inválidas)              | Técnico   | Media        | Medio   | Medio | Modo `MAIL_MOCK=true` para desarrollo; el fallo se captura y el pedido queda en `PENDIENTE_VERIFICACION` sin romper el flujo de compra.                    |
| R-14 | **Regresión de código sin pruebas automatizadas**                               | Técnico   | Alta         | Alto    | Alto  | CI con **ESLint + Prettier + build** en cada push/PR; (recomendado) añadir pruebas unitarias/E2E (ver sección 4).                                          |
| R-15 | **Inconsistencia de rutas** de la API (`/api/orders/confirm` vs `/api/pedidos`) | Técnico   | Media        | Bajo    | Bajo  | Riesgo identificado — pendiente de unificar prefijos para mantener coherencia (registrado como issue).                                                     |
| R-16 | **Almacenamiento de token en `localStorage`** (vulnerable a XSS)                | Seguridad | Baja         | Medio   | Bajo  | Uso de `localStorage` con limpieza en 401; (recomendado) migrar a cookies `httpOnly` + `SameSite` si se endurece el modelo de amenaza.                     |

---

## 2. Riesgos residuales y priorización

| Nivel       | IDs                                      | Acción                                      |
| ----------- | ---------------------------------------- | ------------------------------------------- |
| **Crítico** | —                                        | Ninguno sin mitigar actualmente.            |
| **Alto**    | R-01, R-02, R-03, R-04, R-06, R-14       | Monitoreo continuo y revisiones periódicas. |
| **Medio**   | R-05, R-07, R-08, R-09, R-10, R-12, R-13 | Aceptados con controles existentes.         |
| **Bajo**    | R-11, R-15, R-16                         | Aceptados; R-15 en backlog.                 |

---

## 3. Política de dependencias (R-09)

- Ejecutar `npm audit` en cada PR (recomendado añadir al CI).
- Actualizar dependencias de forma planificada con `npm outdated` y `npm update`.
- Fijar versiones mediante `package-lock.json` y usar `npm ci` en el pipeline.
- Revisar avisos de seguridad de GitHub (Dependabot recomendado).

---

## 4. Trabajo futuro recomendado

1. **Pruebas automatizadas** (R-14): unitarias (Jest/Vitest) y E2E (Playwright) para flujo de confirmación.
2. **Dependabot / `npm audit` en CI** (R-09).
3. **Rate limiting** en endpoints de autenticación (mitiga fuerza bruta, R-03).
4. **Unificar prefijo de rutas de API** (R-15).
5. **Respaldos automáticos de la base de datos** (R-12).
6. **Migrar token a cookies httpOnly** (R-16), si se endurece el modelo de amenaza.

---

## 5. Cómo copiar a la Wiki de GitHub

1. GitHub → repositorio → pestaña **Wiki** → _Create the first page_ (o _New Page_).
2. Crea una página llamada **`Matriz de Riesgos`**.
3. Copia el contenido de este archivo (sección 1 en adelante).
4. Guarda. La tabla Markdown se renderiza automáticamente.
