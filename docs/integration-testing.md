# Pruebas de integración (e2e) — Instrucciones

Este documento describe cómo levantar la base de datos en Docker y ejecutar las pruebas de integración (e2e) que ya se encuentran en `test/`.

Requisitos

- Docker y docker-compose instalados
- Node.js y npm instalados

1. Levantar la base de datos de pruebas (Postgres jwt2)

En PowerShell (desde la raíz del repo):

```powershell
# Levanta el contenedor PostgreSQL para pruebas
docker-compose -f docker-compose.test.yml up -d

# Opcional: verifica que el contenedor esté listo
docker ps
```

El servicio expondrá Postgres en el puerto 5432 y creará la base de datos `jwt2` con usuario `postgres` y contraseña `postgres`.

2. Configurar variables de entorno para las pruebas

En PowerShell:

```powershell
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_USER='postgres'
$env:DB_PASS='postgres'
$env:DB_NAME='jwt2'
```

3. Ejecutar las pruebas e2e

```powershell
# Instala dependencias si es necesario
npm install

# Ejecuta los tests e2e (usa test/jest-e2e.json)
npm run test:e2e
```

4. Apagar la base de datos de pruebas

```powershell
docker-compose -f docker-compose.test.yml down
```

Notas y consideraciones

- Algunas rutas están protegidas por `AuthGuard`. Si tus tests necesitan permisos administrativos, crea un usuario en setup y asígnale roles/permissions mediante la DB o endpoints antes de ejecutar las llamadas protegidas.
- Si la limpieza con `repository.clear()` falla por constraints, considera usar TRUNCATE CASCADE en el setup/teardown.
- Los tests de integración creados se encuentran en `test/integration/*.spec.ts`.
- Los tests E2E (HTTP) se encuentran en la raíz `test/` con sufijo `.e2e-spec.ts`.
