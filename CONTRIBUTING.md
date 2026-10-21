# Guía de Contribución

Gracias por contribuir a **Tienda Steeven** (Tienda Web de Productos Frescos con Confirmación por Correo).
Este documento describe el flujo de trabajo, los estándares y el modelo de ramas del proyecto.

---

## 1. Requisitos previos

- Node.js 18+
- PostgreSQL 14+ (o Docker + Docker Compose)
- Git

---

## 2. Puesta en marcha del entorno

```bash
# 1. Clonar el repositorio
git clone https://github.com/Johanx66/Proyecto-tienda-Steeven.git
cd Proyecto-tienda-Steeven

# 2. Instalar dependencias (backend + frontend)
npm run install:all

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env      # edita credenciales
cp frontend/.env.example frontend/.env

# 4. Levantar todo con Docker (recomendado)
docker compose up --build

#   O en modo desarrollo con recarga en caliente:
npm run dev
```

> **Nota (npm / peer deps):** el frontend usa `vite@8` con un plugin que declara peer `vite@<=7`.
> Por eso existe `frontend/.npmrc` con `legacy-peer-deps=true`. Si instalas manualmente usa
> `npm install --legacy-peer-deps` dentro de `frontend/`.

---

## 3. Modelo de ramas (Git Flow simplificado)

| Rama               | Propósito                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| `main`             | Código estable y desplegable. Solo recibe merges desde `develop` o `hotfix/*`. |
| `develop`          | Rama de integración. Base para las features.                                   |
| `feature/<nombre>` | Nueva funcionalidad. Sale de `develop`. Ej: `feature/confirmacion-email`.      |
| `fix/<nombre>`     | Corrección de bugs. Ej: `fix/estado-no-confirmado`.                            |
| `hotfix/<nombre>`  | Corrección urgente en producción. Sale de `main`.                              |
| `docs/<nombre>`    | Cambios de documentación.                                                      |

### Flujo de trabajo

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama de trabajo
git checkout -b feature/mi-nueva-funcionalidad

# 3. Trabajar y commitear (convención Conventional Commits)
git add .
git commit -m "feat(pedidos): agregar filtro por estado en panel admin"

# 4. Asegurar calidad local antes de subir
npm run lint
npm run format:check
npm run build

# 5. Subir y abrir Pull Request hacia develop
git push -u origin feature/mi-nueva-funcionalidad
gh pr create --base develop --fill
```

---

## 4. Convención de commits (Conventional Commits)

Formato: `<tipo>(<alcance>): <descripción>`

| Tipo       | Uso                                           |
| ---------- | --------------------------------------------- |
| `feat`     | Nueva funcionalidad                           |
| `fix`      | Corrección de bug                             |
| `docs`     | Documentación                                 |
| `style`    | Formato (sin cambio de lógica)                |
| `refactor` | Reestructuración sin cambio de comportamiento |
| `test`     | Añadir o modificar pruebas                    |
| `chore`    | Tareas de mantenimiento / tooling             |
| `ci`       | Cambios en integración continua               |

Ejemplos:

- `feat(auth): validar teléfono en formato E.164`
- `fix(checkout): calcular total con decimales`
- `ci: agregar workflow de lint y build`

---

## 5. Estándares de calidad (obligatorios en PR)

Antes de abrir un Pull Request, el código debe pasar:

```bash
npm run lint          # ESLint (backend + frontend)
npm run format:check  # Prettier
npm run build         # Build de producción del frontend
```

El pipeline de **GitHub Actions** (`.github/workflows/ci.yml`) ejecuta estas validaciones
automáticamente en cada push y PR. Un PR no se fusiona si el CI está en rojo.

- **Backend:** ESLint (`.eslintrc.cjs`) + Prettier.
- **Frontend:** ESLint 9 flat config (`eslint.config.js`) + Prettier.
- **Editor:** respetar `.editorconfig` (LF, 2 espacios, UTF-8).

---

## 6. Revisión de código (Pull Requests)

- Un PR debe resolver **una** tarea/issue y referenciarla (`Closes #12`).
- Máximo razonable de archivos por PR: mantenerlo enfocado.
- Requisitos: CI verde, al menos 1 aprobación, sin conflictos con la base.
- Describe **qué**, **por qué** y **cómo probarlo** en la descripción.

---

## 7. Estructura del proyecto

```
backend/    API REST (Node.js + Express + PostgreSQL)
frontend/   SPA (Vite + React + Bootstrap)
docs/       Diagramas, matriz de riesgos y documentación
.github/    Workflows de CI/CD
```

Ver arquitectura detallada en [`docs/DIAGRAMA_CLASES_UML.md`](docs/DIAGRAMA_CLASES_UML.md).

---

## 8. Preguntas frecuentes

**¿Dónde pongo secretos?** Nunca en el repo. Usa `.env` local (ignorado por Git) partiendo de
`.env.example`. En producción, usa variables de entorno del entorno de despliegue.

**¿Cómo creo un administrador?** Regístrate y actualiza el rol en la BD:

```sql
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'tu@email.com';
```
