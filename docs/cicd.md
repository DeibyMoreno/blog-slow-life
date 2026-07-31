# CI/CD — Guía de aprendizaje

Esta guía explica el **cómo y el porqué** de cada instrucción de los archivos de pipeline:

- `.github/actions/setup/action.yml` — acción compuesta reutilizable
- `.github/workflows/ci.yml` — integración continua
- `.github/workflows/deploy.yml` — despliegue a EC2
- `ecosystem.config.cjs` — config de pm2

## Arquitectura del pipeline

```
 push/PR a main
      │
      ▼
┌──────────────── CI ────────────────┐
│ lint-and-typecheck → test → build  │   ← barrera de calidad
└──────────────────┬─────────────────┘
                   │ push a main
                   ▼
┌────────────── CD ──────────────────┐
│ SSH → git pull → pnpm build →      │
│ migrate deploy → pm2 reload →      │
│ health check                       │   ← entrega a EC2
└────────────────────────────────────┘
```

CI y CD son **workflows separados**. CI corre en cada PR (calidad), CD solo cuando el código llega a `main` (entrega). Así un PR nunca toca producción hasta que se mergea.

---

## 1. `.github/actions/setup/action.yml`

Una **acción compuesta (composite action)** agrupa pasos reutilizables. En vez de repetir el bloque de setup en cada job, cada job hace `uses: ./.github/actions/setup`.

### `name` / `description`
Solo metadatos que se ven en el marketplace/UI. En acciones locales no importa demasiado, pero es buena práctica.

### `inputs.node-version`
Los **inputs** hacen la acción configurable. Aquí el único input es la versión de Node, con un `default: '22'` (la versión del proyecto, ver `engines` en `package.json`). Un job puede sobreescribirlo: `with: { node-version: '24' }`.

### `runs.using: composite`
Le dice a GitHub que esta acción está hecha de **pasos propios** (no es JavaScript ni Docker). Cuando una acción compuesta usa pasos `run:`, cada uno **debe** llevar `shell: bash` — es un requisito del formato, por eso lo ves repetido.

### Los 4 pasos, en orden:

1. **`pnpm/action-setup@v4` con `version: 10`** — instala pnpm (gestor de paquetes). El proyecto usa pnpm (hay `pnpm-lock.yaml`, NO `package-lock.json`). Fijar `version: 10` es explícito: si mañana pnpm lanza v11, tu pipeline no cambia de comportamiento por sorpresa.
2. **`actions/setup-node@v6` con `node-version` y `cache: 'pnpm'`** — instala Node y, con `cache: 'pnpm'`, **cachéa automáticamente** `~/.pnpm-store` usando el hash de `pnpm-lock.yaml` como clave. Si el lockfile no cambió, los segundos corridos restauran deps sin re-descargarlas (la herramienta que hace el trabajo interno es `actions/cache`, pero `setup-node` lo envuelve para que no tengas que configurarlo a mano).
3. **`pnpm install --frozen-lockfile`** — instala dependencias **exactamente** como dice `pnpm-lock.yaml`. La bandera `--frozen-lockfile` hace que **falle** si `package.json` y el lockfile no están sincronizados. Ese es el "why": reproducibilidad. Si un dev olvidó commitear el lockfile, el CI lo detecta en lugar de generar uno nuevo "a su manera".
4. **`pnpm db:generate`** — regenera el **cliente Prisma** (`@prisma/client` v7). El cliente se genera desde `prisma/schema.prisma` y no se commitear; cada entorno (CI, server) lo genera tras instalar.

> **¿Por qué el checkout NO está dentro de la composite action?** El runner resuelve las rutas locales (`uses: ./.github/...`) **leyendo `action.yml` del workspace en el momento en que llega al paso**. Si la composite action que *contiene* el checkout fuera el primer paso del job, el runner intentaría leer el archivo **antes de que el repo exista** → error `Can't find 'action.yml'` (gallina/huevo). Regla: **toda local action debe ir después de un `actions/checkout@v6` explícito en cada job.** (No aplica a actions remotas tipo `actions/setup-node@v6`, que se descargan del marketplace por su ruta `owner/repo@ref`.)

> **¿Por qué composite action y no un reusable workflow?** Las *reusable workflows* orquestan **jobs completos** con su propio `runs-on`, `secrets` y `needs`. Las *composite actions* encapsulan **pasos** dentro de un job. Como aquí la diferencia entre jobs es solo "qué comando correr al final", una composite action es la pieza justa y evita repetir el bloque de setup 3 veces.

---

## 2. `.github/workflows/ci.yml`

### `on: push [main]` + `pull_request [main]`
Los **disparadores (events)**:
- `push` a `main`: cada merge dispara CI para validar el código que quedó en la rama.
- `pull_request` a `main`: cada PR/actualización de PR dispara CI **antes** de mergear — es la barrera que evita romper `main`.
- *(Se eliminó `develop`: solo `main` como flujo trunk-based. Menos ramas = menos estados que mantener.)*

### `permissions: contents: read`
Bloque **de permisos** para el `GITHUB_TOKEN`. Sin este bloque, GitHub otorga al token permisos por defecto que suelen ser más amplios de lo necesario. Aquí declaramos el **principio de menor privilegio**: este workflow solo necesita *leer* el repo. Si algún paso intentara escribir (push, crear releases, etc.), fallaría — y eso es bueno, es una red de seguridad ante un step comprometido.

> ⚠️ Nota: el flujo GHCR anterior (`cd.yml`) necesitaba `packages: write` para subir imágenes — por eso era más vulnerable. Al eliminarlo, el CI solo lee.

### `concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true`
- **`group`** agrupa runs por rama/PR (`${{ github.ref }}` es la referencia: `refs/heads/main`, `refs/pull/42/merge`...).
- **`cancel-in-progress: true`** cancela el run *anterior* de ese grupo si llega uno nuevo.
- **Why:** si haces 3 pushes seguidos a una rama, no tiene sentido correr CI 3 veces sobre el mismo código viejo. Se cancela lo obsoleto y solo corre lo último → ahorra minutos y evita notificaciones duplicadas.

### `env: NODE_VERSION` y `DATABASE_URL` a nivel workflow
- **`NODE_VERSION: '22'`** — una sola fuente de verdad para todos los jobs.
- **`DATABASE_URL`** a nivel workflow: heredada por todos los jobs. Está aquí (y no solo en el job de test) porque la acción compuesta corre `pnpm db:generate`, y `prisma.config.ts` define `datasource.url = process.env.DATABASE_URL!`; si la var no existe, el CLI de Prisma puede fallar. Es un URL **falso de CI** (apunta a `localhost` del runner), nunca toca tu RDS.

### Job `lint-and-typecheck`
- `pnpm lint` — reglas ESLint (estilo + errores comunes).
- `pnpm typecheck` — `tsc --noEmit`: valida tipos sin emitir nada.
- Ambos son rápidos y estáticos: se corren **primero** para fallar barato. Por eso los otros jobs dependen de él.

### Job `test` — la parte interesante

```yaml
needs: lint-and-typecheck
services:
  postgres:
    image: postgres:16-alpine
    ...
    options: >-
      --health-cmd pg_isready
```

- **`needs:`** define el **grafo de dependencias**. El job `test` no corre hasta que `lint-and-typecheck` pase. Sin `needs`, los jobs corren en paralelo.
- **`services:`** levanta un **contenedor PostgreSQL efímero** dentro del runner. Se usa `16-alpine` porque el proyecto está en Prisma 7/PostgreSQL y es ligero.
- Las variables `POSTGRES_DB/USER/PASSWORD` crean la BD `slowlife_test` con usuario `test` — por eso `DATABASE_URL` del workflow dice `postgresql://test:test@localhost:5432/slowlife_test`.
- **`options` con `--health-cmd pg_isready`**: el *healthcheck*. GitHub espera a que el contenedor responda "listo" antes de seguir. Sin esto, `prisma migrate deploy` podría intentar conectar antes de que Postgres esté aceptando conexiones → race condition.
- **Why el postgres efímero:** los tests del proyecto exigen una `DATABASE_URL` válida (el `env.ts` valida con Zod y hace `exit 1` si falta). En vez de apuntar a tu RDS de producción (como hace el `.env.test` local — ¡riesgo!), el CI levanta una BD **descartable** que muere al terminar el run. El `DATABASE_URL` del workflow **gana sobre `.env.test`** porque `dotenv` nunca sobreescribe variables ya presentes en `process.env`.

Pasos:
- `pnpm prisma migrate deploy` — aplica las **migraciones del repo** a la BD efímera. Doble beneficio: prepara la BD **y** valida que las migraciones funcionan en limpio.
- `pnpm test` — `vitest run`.
- **`$GITHUB_STEP_SUMMARY`** — cada paso puede escribir Markdown a `$GITHUB_STEP_SUMMARY`, que se renderiza como resumen del run en la UI del workflow (más legible que escarbar el log). Es la forma moderna de "reportes" en Actions.

### Job `build`
Corre `pnpm build` (`tsc + tsc-alias + copyfiles`). Se incluye porque hay cosas que **solo fallan en build, no en typecheck/lint**: `tsc-alias` reescribe los imports de `@/` alias → rutas relativas, y `copyfiles` copia los `.graphql` a `dist/`. Validarlo en CI evita el clásico "buildo bien local pero no en el server".

---

## 3. `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main]
```

Solo se despliega cuando algo **llega a `main`** (merge de PR). Cada merge = nuevo deploy. Se asume que CI ya pasó en el PR.

### `permissions: contents: read`
Aquí el token no sirve para nada crítico (el deploy es vía SSH), pero declarar el mínimo es la norma.

### `concurrency: group: deploy, cancel-in-progress: false`
- **`group: deploy`** — literalmente un grupo llamado "deploy".
- **`cancel-in-progress: false`** — **nunca cancela un deploy en curso**. Si llega un segundo push mientras se despliega el primero, el segundo **espera** a que termine. Cancelar un deploy a mitad de camino = estado inconsistente del server (deps a medias, migraciones aplicadas pero código viejo...).

### `environment: production`
Los **environments** de GitHub:
- Agrupan secrets/vars por entorno (puedes tener secrets distintos en `production` vs `staging`).
- Permiten **protection rules** (p. ej. aprobación manual antes de desplegar) — opcional aquí.
- Muestran el deploy con URL en la pestaña "Deployments" y en el run.

### `timeout-minutes: 15`
Límite duro. Un `git pull` colgado o una instalación lenta no pueden dejar el job corriendo para siempre (default: 6h). El deploy completo de este proyecto debería tardar 2-4 min.

### `appleboy/ssh-action@v1.0.3`
Acción de terceros que abre una conexión **SSH** al EC2 y ejecuta el script. Los parámetros vienen de **secrets** (Settings → Secrets and variables → Actions):

| Secret | Qué es |
|---|---|
| `EC2_HOST` | IP pública o DNS del EC2 |
| `EC2_USER` | Usuario con el que conectamos (p. ej. `ubuntu`, `deploy`, `ec2-user`) |
| `EC2_SSH_KEY` | **Clave privada** del keypair ed25519 |
| `EC2_APP_DIR` | Ruta del repo clonado en el server (p. ej. `/opt/slowlife`) |

> Los secrets nunca aparecen en el log (GitHub los enmascara) y nunca viajan al repositorio.

### El script SSH, línea por línea

```sh
set -e
```
**El más importante del script.** Le dice a bash: *si cualquier comando falla, aborta aquí mismo*. Sin esto, si `pnpm build` falla, el script seguiría hasta el `pm2 reload` desplegando código roto. `set -e` + CI/CD = no desplegar errores.

```sh
cd ${{ secrets.EC2_APP_DIR }}
```
Posicionarse en el repo. Las rutas se mantienen como **secret** (no hardcodeadas en el repo) porque son información de infraestructura.

```sh
git pull --ff-only origin main
```
Trae el código nuevo. **`--ff-only`** (fast-forward only) es la red de seguridad: si el repo del server tiene commits locales que no están en `main` (alguien committeó directo ahí), `git pull` falle en vez de crear un merge local. El server debe ser un **espejo limpio** de `main`.

```sh
pnpm install --frozen-lockfile
```
Mismas dependencias exactas que en CI. (Ojo: esto fue `npm install` en tu primer borrador — el proyecto es pnpm; `npm install` habría creado un `package-lock.json` dentro del repo y desincronizado el lockfile.)

```sh
pnpm db:generate
pnpm build
```
Genera el cliente Prisma y compila a `dist/`.

```sh
pnpm prisma migrate deploy
```
Aplica las migraciones **pendientes** a RDS. Es `deploy`, no `dev`: `migrate dev` es solo para desarrollo (puede reiniciar/recrear la BD); `migrate deploy` aplica solo lo nuevo en orden. **Este paso va después del build y antes del reload**:

- *Después del build*: no migras una BD para un código que no compiló.
- *Antes del reload*: cuando el proceso nuevo arranque, la BD ya está lista para él.

> ¿De dónde saca la `DATABASE_URL`? `prisma.config.ts` hace `import 'dotenv/config'`, que carga `.env` desde el **directorio de trabajo actual**. Como el script hizo `cd $EC2_APP_DIR`, la cwd es la carpeta de la app y ahí está tu `.env` → prisma lee la URL. Por eso **no necesitas `source .env.production`**: tu server usa `.env` como fuente única. (Si algún día quieres separar entornos, tendrías que tocar `prisma.config.ts` para cargar `.env.production`, porque por defecto solo lee `.env`.)

```sh
pm2 startOrReload ecosystem.config.cjs
```
- **`startOrReload`** — si el proceso ya existe, hace **reload**; si no existe, lo **crea**. Con `startOrReload` el mismo comando sirve para el primer deploy y para los siguientes (con `pm2 restart` puro, el primer deploy fallaría con "process not found").
- `ecosystem.config.cjs` define `NODE_ENV: 'production'`, lo que garantiza que la app:
  - cargue el entorno correcto en `env.ts` (aunque uses `.env`, el `NODE_ENV` gobierna comportamientos: error masking, caché global de Prisma, `isProd`, formato de logs),
  - sea reproducible: cualquier persona/script que arranque la API obtiene la misma config, sin depender de variables exportadas a mano en la sesión de shell.

```sh
curl -fsS http://localhost:4000/health
```
**Health check dentro del SSH** (no como step del runner: desde GitHub no llegas al `localhost` del EC2). `-f` (fail on HTTP error), `-s` (silencioso), `-S` (muestra el error si falla). Verifica que la app quedó viva y respondiendo **después** del deploy. Es el smoke test final: si el proceso crasheó al arrancar, el deploy falla y lo ves en rojo.

---

## 4. `ecosystem.config.cjs`

```js
module.exports = {
  apps: [
    {
      name: 'blog-slow-life-api',   // -> pm2 startOrReload usa este nombre
      script: 'dist/index.js',      // entry point de producción (el build)
      cwd: __dirname,               // el repo; evita dependencias de dónde se lanzó pm2
      instances: 1,
      exec_mode: 'fork',            // un solo proceso (default). 'reload' solo da zero-downtime con 'cluster'
      env: { NODE_ENV: 'production' },
    },
  ],
}
```

- **`.cjs`** en un proyecto `"type": "module"`: pm2 necesita CommonJS para cargar la config; la extensión `.cjs` lo garantiza sin tocar el `package.json`.
- **`instances: 1` / `exec_mode: 'fork'`**: un solo proceso. Con esto `reload` se comporta como `restart` (hay downtime de milisegundos). El zero-downtime real requiere **cluster mode** (`instances: 'max'`, `exec_mode: 'cluster'`) — para tu volumen actual no vale la pena; queda como nota.
- El script hace `pm2 startOrReload`, que internamente: si existe → `reload blog-slow-life-api`; si no → `start ecosystem.config.cjs`.

---

## 5. Precedencia de variables de entorno (por qué tu server "simplemente funciona")

`src/config/env.ts` hace:
```ts
dotenv.config({ path: ... envFile })  // '.env.production' si NODE_ENV=production
dotenv.config({ path: ... '.env' })   // siempre
```

Regla de `dotenv`: **nunca sobreescribe** variables ya presentes en `process.env`. Entonces:

1. Si `NODE_ENV=production` y existe `.env.production` → esos valores se cargan primero y **ganan**.
2. Si `.env.production` **no existe**, `dotenv` lo salta sin error y `.env` aporta todo.
3. `.env` solo *rellena huecos* de lo anterior.

Tu setup actual: `.env` único en el server → la app lee todo de ahí, sin importar `NODE_ENV`. **Funciona y es válido.** La advertencia a futuro: si algún día creas `.env.production` con un subset de variables, esas **ganarían** sobre `.env` (porque se cargan primero) — puedes tener valores que no esperas.

---

## 6. Prerrequisitos en AWS/GitHub (una sola vez)

1. **Deploy key en EC2:**
   - Generar: `ssh-keygen -t ed25519 -f ~/.ssh/slowlife_deploy`
   - Clave **privada** → secret `EC2_SSH_KEY` (en Settings → Secrets → Actions).
   - Clave **pública** → `~/.ssh/authorized_keys` del usuario `EC2_USER` en el server.
   - Ideal: usuario dedicado (sin password ni login shell), con permiso solo sobre `EC2_APP_DIR` y pm2.
2. **Repo clonado en el server** en `EC2_APP_DIR` (p. ej. `/opt/slowlife`), con el `.env` de producción ahí (con `DATABASE_URL` a RDS, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, CORS...). **El `.env` no se sube al repo** (`.gitignore` lo excluye).
3. **pm2 en el server:** `pnpm install` + `pnpm build` + `pm2 start ecosystem.config.cjs` (primera vez). El deploy siguiente usará `startOrReload`.
4. **Security Group del EC2:** SSH (22) abierto **solo a los rangos de IP de GitHub Actions** (se publican en `https://api.github.com/meta` → lista `actions`). Los rangos rotan, así que hay que actualizarlos periódicamente o aceptar el riesgo. Nunca exponer SSH a `0.0.0.0/0`.
5. **Secrets en GitHub:** `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`.

## 7. Verificación del pipeline

- **CI:** sube una rama o abre un PR → ve el run en Actions. Espera `lint-and-typecheck → test → build` en verde.
- **CD:** mergea a `main` → corre `Deploy to EC2` → revisa en el server `pm2 logs blog-slow-life-api` y `curl localhost:4000/health`.
- Si un deploy rompe algo, `git revert` en `main` dispara un nuevo deploy con el código anterior (el CD es reactivo al contenido de `main`).

## 8. Nota de seguridad pendiente

`.env.test` **está committeado** en el repo (`.gitignore` no lo excluye) y su `DATABASE_URL` apunta a tu **RDS de producción** (`postgresql://postgres:postgres@blog-slowlife...`). El CI ya lo sobreescribe, pero:

- Cualquiera con acceso al repo ve el endpoint y credenciales de tu BD.
- Si alguien corre `pnpm test` localmente **sin override**, escribe contra tu RDS real.

**Recomendación:** reemplazar ese `DATABASE_URL` por un postgres local y/o agregar `.env.test` al `.gitignore` + rotar las credenciales del RDS.

## 9. Solución de problemas del deploy

Si el job `deploy` falla en `appleboy/ssh-action`, los errores que verás y su causa:

| Error en el log | Causa raíz | Fix |
|---|---|---|
| `ssh: no key found` | El secret `EC2_SSH_KEY` no contiene una clave privada válida. Casi siempre: copiaste la **pública** (`.pub`), o el contenido quedó con formato roto (secrets multilínea deben pegarse con saltos de línea reales, no `\n` literales) | Re-crear el secret con el contenido exacto de la clave **privada** (`cat ~/.ssh/slowlife_deploy`, empieza con `-----BEGIN OPENSSH PRIVATE KEY-----`) |
| `dial tcp <host>:22: i/o timeout` | Sin ruta al puerto 22. `i/o timeout` = el paquete se descarta (firewall/SG), NO "connection refused". Causas: SG sin regla inbound para SSH desde IPs de GitHub, o `EC2_HOST` no es una IP pública | 1) Abrir TCP 22 en el SG solo a los rangos `actions` de `https://api.github.com/meta`. 2) Verificar que `EC2_HOST` sea la IP elástica/DNS público (no `10.x`/`172.x`) |
| `connection refused` (en lugar de timeout) | El puerto 22 está abierto pero `sshd` no escucha o el host es otro | `sudo systemctl status ssh` en el server |

### Diagnóstico desde tu máquina

```bash
# ¿La key y las credenciales funcionan desde fuera de GitHub?
ssh -i ~/.ssh/slowlife_deploy <EC2_USER>@<EC2_HOST> echo ok

# ¿El puerto 22 responde desde el internet?
nc -zv <EC2_HOST> 22
```

- Si **ambos** funcionan desde tu máquina → el bloqueo es el SG contra las IPs de GitHub Actions.
- Si el `nc` da **timeout** → `EC2_HOST` no es alcanzable públicamente (IP privada o SG).

### Nota sobre "Can't find action.yml" (CI)

Ese error **no tiene relación** con el deploy: es exclusivo del CI cuando una local action (`uses: ./.github/...`) se referencia sin un `actions/checkout` previo en el mismo job. Ver §1.
