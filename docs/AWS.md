# Laboratorio AWS: Backend GraphQL + PostgreSQL + CI/CD

### Documentación de despliegue y resolución de problemas

**Stack:** Node.js + GraphQL + PostgreSQL (Prisma) + AWS (EC2, RDS, S3, IAM) + GitHub Actions
**Frontend:** Next.js en Vercel (fuera de este lab)

---

## Índice

1. [Arquitectura general](#arquitectura-general)
2. [Laboratorio 1: Despliegue en AWS](#laboratorio-1-despliegue-en-aws)
3. [Laboratorio 2: CI/CD con GitHub Actions](#laboratorio-2-cicd-con-github-actions)
4. [Registro de problemas y soluciones](#registro-de-problemas-y-soluciones)
5. [Checklist para CV/portafolio](#checklist-para-cvportafolio)

---

## Arquitectura general

```
Vercel (Next.js) ──HTTPS──> Nginx (EC2) ──proxy──> Node.js/GraphQL (PM2)
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    ▼                                           ▼
                            RDS PostgreSQL                              S3 (imágenes)
                         (privada, mismo VPC)                    (presigned URLs / público)

GitHub → push a main → GitHub Actions → SSH → EC2 (pull, build, migrate, pm2 restart)
```

---

## Laboratorio 1: Despliegue en AWS

### Paso 0 — Presupuesto

- Budget de $10-15/mes en **Billing → Budgets**.
- Free Tier usage alerts activadas.

### Paso 1 — IAM

- Usuario personal con permisos `AdministratorAccess` (vía grupo, buena práctica).
- Nunca se usa el usuario root para el día a día.
- Login vía `https://<account-id-o-alias>.signin.aws.amazon.com/console`.

### Paso 2 — S3 (bucket de imágenes)

- Bucket privado (Block Public Access activado) inicialmente.
- CORS configurado para permitir `PUT`/`GET` desde el dominio de Vercel y localhost.
- **Decisión final:** como las imágenes son para un blog (contenido público), se optó por bucket con lectura pública vía Bucket Policy, manteniendo la subida protegida por presigned URL.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<bucket>/*"
    }
  ]
}
```

### Paso 3 — RDS PostgreSQL

- `db.t3.micro`, Free Tier, 20GB storage.
- **Public access: No** — solo accesible desde la VPC (EC2).
- Security group de RDS permite entrada en puerto 5432 únicamente desde el security group de EC2.

### Paso 4 — EC2

- Ubuntu 24.04 LTS, `t3.micro`/`t2.micro`.
- Security group: SSH (22) restringido a IP propia, HTTP (80) y HTTPS (443) abiertos.
- Elastic IP asociada (evita que la IP pública cambie al detener/iniciar).
- **IAM Role** asignado a la instancia (no access keys) con permiso mínimo:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject"],
  "Resource": "arn:aws:s3:::<bucket>/*"
}
```

### Paso 5 — Servidor

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 pnpm
sudo apt install -y nginx postgresql-client
```

### Paso 6 — Proyecto y variables de entorno

```bash
git clone <repo> ~/blog-slow-life
cd ~/blog-slow-life
pnpm install
```

`.env` en el servidor (nunca en git):

```
DATABASE_URL=postgresql://postgres:<password>@<endpoint-rds>:5432/postgres
S3_BUCKET=<bucket>
AWS_REGION=us-east-1
PORT=4000
```

```bash
npx prisma generate
npx prisma migrate deploy
pnpm run build
pm2 start npm --name "blog-slow-life-api" -- start
pm2 save
pm2 startup   # + ejecutar el comando que imprime
```

### Paso 7 — Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name <ip-o-dominio>;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 8 — Conexión con Vercel

Variable de entorno en Vercel:

```
NEXT_PUBLIC_GRAPHQL_URL=http://<ip-o-dominio>/graphql
```

### Paso 9 — Administración de la base con DBeaver

Túnel SSH (RDS es privada):

- **Main:** host = endpoint RDS, puerto 5432, usuario/password de RDS.
- **SSH:** host = IP pública EC2, usuario `ubuntu`, autenticación por llave pública (`.pem`).

### Gestión de costos

- **EC2:** `Stop` (no `Terminate`) cuando no se practica activamente — cobra por hora encendida.
- **RDS:** se puede detener hasta 7 días seguidos.
- **S3:** Always Free (5GB almacenamiento, 20k GET, 2k PUT al mes) — irrelevante para un lab pequeño.
- **Elastic IP:** gratis solo mientras está asociada a una instancia corriendo; sin asociar, cobra.

---

## Laboratorio 2: CI/CD con GitHub Actions

### Conceptos

- **CI:** valida el código automáticamente en cada push (build, tests).
- **CD:** despliega automáticamente tras pasar CI.

### Opciones evaluadas

| Opción                                      | Cuándo usarla                                         |
| ------------------------------------------- | ----------------------------------------------------- |
| **GitHub Actions + SSH** ⭐ elegida         | Reutiliza infraestructura EC2 existente, setup rápido |
| GitHub Actions + AWS CodeDeploy             | Rollback automático, despliegues graduales            |
| CodePipeline + CodeBuild + CodeDeploy       | Ecosistema 100% AWS, sin GitHub Actions               |
| GitHub Actions + Docker + ECR + ECS Fargate | Arquitectura serverless, siguiente nivel              |

### Configuración implementada

**1. Llave SSH dedicada (generada en el servidor, no confundir con el `.pem` de la consola EC2):**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key -N ""
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_key   # copiar completo, incluyendo BEGIN/END, a GitHub Secrets
```

**2. GitHub Secrets:** `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`

**3. Workflow final** (`.github/workflows/deploy.yml`):

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpm install
      - run: pnpm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ${{ secrets.EC2_APP_DIR }}
            git reset --hard origin/main
            git pull origin main
            pnpm install
            npx prisma generate
            npx prisma migrate deploy
            pnpm run build
            pm2 restart blog-slow-life-api
```

### Notas de seguridad aplicadas

- Llave SSH exclusiva para GitHub Actions, revocable sin afectar el acceso personal.
- Puerto 22 abierto más ampliamente (runners de GitHub tienen IP dinámica) — mitigado con login solo por llave, nunca por password.
- `git reset --hard origin/main` antes del pull, para que el servidor sea siempre un espejo exacto de `main` y nunca falle por cambios locales accidentales.

---

## Registro de problemas y soluciones

### 1. Bucket S3 privado → `AccessDenied` al acceder a una imagen desde fuera

**Causa:** Block Public Access activado por diseño; el acceso directo por URL es anónimo.
**Solución:** para contenido de blog (público), se desactivó Block Public Access y se agregó una Bucket Policy de lectura pública. La subida se mantuvo protegida vía presigned URL (`PutObjectCommand` + `getSignedUrl`), generada solo por el backend autenticado.

### 2. SSH `Connection timed out`

**Causa:** el security group restringía el puerto 22 a una IP específica que había cambiado (IP dinámica del ISP).
**Solución:** actualizar la regla del security group con el botón "My IP" en la consola de EC2.

### 3. `404 Not Found (nginx)` al llamar `/graphql`

**Causa:** la directiva `try_files $uri $uri/ =404;` (heredada de la plantilla por defecto de Nginx para archivos estáticos) interceptaba las peticiones antes de llegar al `proxy_pass`.
**Solución:** eliminar `try_files` del bloque `location /`, dejando únicamente la configuración de proxy hacia `localhost:4000`.

### 4. Error de permisos al editar `/etc/nginx/sites-available/default`

**Causa:** el archivo pertenece a `root`.
**Solución:** editar con `sudo nano ...` (o `sudo tee` para escritura por script).

### 5. Prisma: `ERR_MODULE_NOT_FOUND: Cannot find package '@config/modules'`

**Causa:** los path aliases de TypeScript (`@config/*`) no se resuelven automáticamente al compilar a JavaScript puro; `node dist/index.js` no entiende esos alias.
**Solución:** agregar `tsc-alias` al proceso de build para reescribir los alias a rutas relativas reales:

```json
{ "scripts": { "build": "tsc && tsc-alias" } }
```

### 6. Prisma: `User was denied access on the database 'postgres'`

**Causa:** el `datasource` en `schema.prisma` no tenía la línea `url = env("DATABASE_URL")`. El CLI de Prisma (`prisma.config.ts`) sí resolvía la URL correctamente para migraciones, pero el `PrismaClient` instanciado en runtime dependía del `schema.prisma`, que estaba incompleto.
**Solución:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

seguido de `npx prisma generate` y rebuild.

### 7. PM2 no persiste procesos tras reinicio del servidor

**Causa:** falta configurar el arranque automático de PM2 a nivel de sistema operativo.
**Solución:**

```bash
pm2 startup   # ejecutar el comando systemd que imprime
pm2 save      # guarda snapshot de procesos activos
```

### 8. CI/CD: `git pull` falla — "Your local changes... would be overwritten"

**Causa:** archivos modificados directamente en el servidor durante sesiones de debug (`pnpm-lock.yaml`, `prisma/seed.ts`), sin commitear.
**Solución:** forzar que el servidor sea siempre un espejo del repo remoto:

```bash
git reset --hard origin/main
git pull origin main
```

Incorporado como paso fijo al inicio del script de deploy en el workflow.

### 9. `ERR_UNKNOWN_BUILTIN_MODULE: No such built-in module: node:sqlite`

**Causa:** desajuste de versión de Node.js entre sesiones interactivas y no interactivas del servidor (`nvm` cargaba Node v22 solo en shells de login; el `PATH` no interactivo —el que usa GitHub Actions vía SSH— resolvía a `/usr/bin/node` v20, versión con la que `pnpm` 11.x es incompatible).
**Diagnóstico:**

```bash
which node && node -v                       # sesión interactiva
ssh usuario@ip "which node && node -v"       # sesión no interactiva (simula el workflow)
```

**Solución:** eliminar la ambigüedad reinstalando Node.js v22 directamente vía el paquete del sistema (`apt`), asegurando que `/usr/bin/node` sea la única fuente de verdad, consistente en cualquier tipo de sesión:

```bash
sudo apt remove nodejs -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 10. PM2 muestra `status: online` pero `pid: N/A` y la API no responde

**Causa:** condición de carrera durante el `pm2 restart` automático del deploy — el proceso anterior murió mientras PM2 intentaba monitorear su uso de recursos (`pidusage`), dejando un registro "fantasma" sin PID real asociado.
**Solución:**

```bash
pm2 delete blog-slow-life-api
pm2 start npm --name "blog-slow-life-api" -- start
pm2 save
```

### Nota aparte: ruido de logs por bots

`GET /phpinfo.php3 - 404` y peticiones similares en los logs corresponden a bots automatizados escaneando puertos abiertos en internet buscando vulnerabilidades conocidas (no relacionado con la app). Es tráfico esperado en cualquier IP pública; el 404 es la respuesta correcta. Mitigable a futuro con `fail2ban` si se vuelve ruidoso.

---

## Checklist para CV/portafolio

- **IAM:** usuarios, grupos, roles de instancia, políticas de mínimo privilegio.
- **EC2:** provisioning, security groups, Elastic IP, gestión de costos (stop/start).
- **RDS PostgreSQL:** acceso privado vía VPC/security groups, administración remota vía túnel SSH.
- **S3:** buckets, políticas públicas/privadas, presigned URLs, CORS.
- **Nginx:** reverse proxy, debugging de configuración.
- **PM2:** gestión de procesos Node en producción, persistencia tras reinicio.
- **CI/CD:** pipeline con GitHub Actions (test + deploy), gestión segura de secretos, despliegue automatizado vía SSH.
- **Debugging real de infraestructura:** resolución de problemas de red, permisos de Linux, desajustes de versiones (Node/pnpm), y errores de configuración de ORM (Prisma) en un entorno de producción real — no solo tutorial.
