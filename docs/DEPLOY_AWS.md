# Desplegar en AWS con publicaciones automáticas

Este proyecto se publica en una instancia EC2 con Docker Compose. GitHub Actions
ejecuta CI en cada cambio y, si pasa en `main`, envía el código a un bucket S3 y
ordena a la instancia actualizarse mediante Systems Manager (SSM). En producción
usa el perfil `production` de Compose para incluir Caddy. No se abre SSH
para GitHub, no se exponen PostgreSQL ni la API y no se guardan llaves AWS en GitHub.

## 1. Crear la instancia EC2

En la consola de AWS, abre **EC2 → Launch instance** y configura:

- Nombre: `tienda-frescos`.
- Imagen: Ubuntu Server 24.04 LTS, arquitectura x86_64.
- Tipo: al menos 2 vCPU y 4 GB de RAM para construir las imágenes Docker.
- Almacenamiento: 20 GB o más.
- Crea y descarga un par de claves para tu acceso administrativo.
- Red: asigna una IPv4 pública.
- Grupo de seguridad: SSH (22) desde **My IP**, HTTP (80) y HTTPS (443) desde
  cualquier origen. No agregues reglas para 5000, 5432 ni otros puertos de
  contenedores.
- En **Advanced details → IAM instance profile**, asigna el rol de instancia de
  la sección 3.

AWS cobra por los recursos activos; revisa el estimador y la página de precios de
EC2 para la región y el tipo que elijas.

## 2. Preparar la instancia

Conéctate por SSH desde tu equipo usando la clave descargada. Instala Docker
Engine y el plugin Docker Compose siguiendo la [guía oficial para Ubuntu](https://docs.docker.com/engine/install/ubuntu/).
Agrega el usuario `ubuntu` al grupo Docker y vuelve a iniciar sesión para que
pueda ejecutar `docker compose`.

Crea `/home/ubuntu/tienda/.env` en la instancia. No lo guardes en Git:

```dotenv
DB_NAME=tienda_frescos
DB_USER=tienda_app
DB_PASSWORD=REEMPLAZA_POR_UN_SECRETO_ALEATORIO_LARGO
JWT_SECRET=REEMPLAZA_POR_OTRO_SECRETO_ALEATORIO_LARGO
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://TU_DOMINIO
WEBHOOK_BASE_URL=https://TU_DOMINIO
FRONTEND_PORT=127.0.0.1:8080
MAIL_MOCK=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Tienda <no-reply@example.com>"
VERIFICATION_TOKEN_TTL_MINUTES=30
ADMIN_EMAIL=admin@tiendafrescos.local
ADMIN_PASSWORD=
ADMIN_NAME=Administrador de la tienda
ADMIN_PHONE=+570000000000
```

Genera valores aleatorios diferentes para `DB_PASSWORD` y `JWT_SECRET`. Para
correo real, cambia `MAIL_MOCK=false` y completa las variables SMTP.
`FRONTEND_PORT=127.0.0.1:8080` deja el frontend en el host local; Caddy lo publica
en los puertos 80 y 443.

Caddy usa el `Caddyfile` del repositorio, obtiene y renueva automáticamente el
certificado HTTPS y redirige `www` al dominio principal. Antes de desplegar, crea
registros A para el dominio y `www` que apunten a la Elastic IP, y permite los
puertos 80 y 443 en el grupo de seguridad.

## 3. Crear el rol de la instancia EC2

En **IAM → Roles**, crea un rol para **EC2** y adjunta la política administrada
`AmazonSSMManagedInstanceCore`. Agrega esta política inline, sustituyendo la
región, cuenta y nombre del bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::NOMBRE_BUCKET/releases/*"
    }
  ]
}
```

Asigna este rol a la instancia EC2. El agente SSM debe aparecer como **Online**
en **Systems Manager → Fleet Manager** o **Managed nodes**.

## 4. Crear el bucket privado para el código de despliegue

En **S3 → Create bucket**, crea un bucket con un nombre único, en la misma región
de la instancia. Mantén **Block all public access** activado y deja el cifrado
predeterminado habilitado. No alojes la página desde este bucket; se usa solo como
transporte privado del paquete entre GitHub Actions y EC2.

## 5. Dar a GitHub permiso temporal y limitado

En **IAM → Identity providers**, crea un proveedor OIDC con URL
`https://token.actions.githubusercontent.com` y audiencia `sts.amazonaws.com`.

En **IAM → Roles**, crea un rol llamado `GitHubTiendaDeploy` y usa este documento
de confianza. Sustituye `AWS_ACCOUNT_ID` por tu ID de cuenta. El permiso está
limitado a este repositorio y a cambios en `main`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:Johanx66@176552706/Proyecto-tienda-Steeven@1417481610:ref:refs/heads/main"
      }
    }
  }]
}
```

Adjunta al rol una política con los permisos siguientes, reemplazando los valores
marcados. El permiso para SSM limita el envío de órdenes a esa instancia y al
documento administrado que ejecuta comandos de Linux:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::NOMBRE_BUCKET/releases/*"
    },
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:REGION::document/AWS-RunShellScript",
        "arn:aws:ec2:REGION:AWS_ACCOUNT_ID:instance/INSTANCE_ID"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ssm:GetCommandInvocation",
      "Resource": "*"
    }
  ]
}
```

## 6. Configurar variables en GitHub

En el repositorio, abre **Settings → Secrets and variables → Actions → Variables**
y crea estas variables (no son contraseñas):

| Nombre | Valor |
|---|---|
| `AWS_REGION` | Región de EC2 y S3, por ejemplo `us-east-1` |
| `AWS_DEPLOY_ROLE_ARN` | ARN del rol `GitHubTiendaDeploy` |
| `AWS_DEPLOY_BUCKET` | Nombre del bucket privado |
| `AWS_EC2_INSTANCE_ID` | ID de la instancia, por ejemplo `i-0123456789abcdef0` |

La autenticación usa OIDC y credenciales temporales. No crees una llave de acceso
de IAM ni la guardes en GitHub.

## 7. Publicar

Revisa y confirma los cambios de despliegue en tu equipo, luego súbelos a la rama
`main`. En **Actions**, el workflow `CI` ejecutará las verificaciones; solo si
ambas pasan, enviará la versión de ese commit a EC2. La página publicada para este
proyecto está en <https://proyectosteeven.dpdns.org>. Si se usa otra instancia o
dominio, sustituye ese enlace por la URL que apunte a ella.

La primera ejecución inicializa PostgreSQL y carga productos de ejemplo. Después
del primer despliegue, crea la cuenta administradora:

```bash
cd /home/ubuntu/tienda
docker compose exec backend npm run admin:create
```

El comando genera una contraseña aleatoria y la muestra una sola vez para que la
guardes en un gestor de contraseñas. También puedes definir `ADMIN_PASSWORD` en
el `.env` de EC2 con una clave privada de al menos 16 caracteres. El acceso se
realiza desde `https://TU_DOMINIO/admin/login`; la contraseña se guarda con
bcrypt y no se incluye en el repositorio.

## 8. Actualizaciones posteriores

Haz cambios en el proyecto y súbelos a `main`. GitHub Actions ejecuta lint y
build; si pasan, reemplaza el código de la instancia y reconstruye los
contenedores. Los datos de PostgreSQL permanecen en el volumen Docker
`postgres_data`. No uses `docker compose down -v` en producción porque borra ese
volumen.
