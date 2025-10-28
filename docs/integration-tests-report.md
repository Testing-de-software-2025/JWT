## Informe: Pruebas de integración (test/integration)

Fecha: 28 de octubre de 2025

Resumen ejecutivo

Este informe cubre los tres tests de integración ubicados en `test/integration` (Users, Roles, Permissions). Incluye:

- Explicación de las partes más importantes del código de cada test.
- Errores encontrados durante la ejecución y su causa raíz.
- Cómo los solucionamos (pasos concretos aplicados).

Archivos analizados

- `test/integration/permissions.integration.spec.ts`
- `test/integration/roles.integration.spec.ts`
- `test/integration/users.integration.spec.ts`

1. Puntos importantes de los tests (qué hacen y por qué importa)

- Levantado del módulo real: todos los tests usan `Test.createTestingModule({ imports: [AppModule] })` y `moduleFixture.createNestApplication()`.

  - Por qué es importante: esto convierte las pruebas en integración verdadera — los providers (servicios), TypeORM y la configuración real son los que se ejercitan.

- Hooks de setup/teardown:

  - `beforeAll`: compila el testing module, crea la app, obtiene `DataSource` y los servicios con `app.get(...)`, y ejecuta una limpieza inicial SQL (TRUNCATE ... RESTART IDENTITY CASCADE).
  - `afterAll`: vuelve a truncar tablas y cierra la aplicación.
  - Por qué: garantiza que cada ejecución parte de un estado limpio y evita flakiness por FK o datos residuales.

- Uso de servicios públicos (no mocks):

  - `permissionsService.create/findById/update/delete`, `rolesService.create/findById/assignPermissions`, `usersService.register/findByEmail/assignRoles/canDo`.
  - Por qué: la intención era que las pruebas de integración NO accedieran directamente a repositorios ni hicieran mocking — se prueba la API pública de los servicios.

- Casos clave por archivo:
  - permissions.integration: create → findById; update → findById; delete → findById (espera rechazo por NotFound).
  - roles.integration: create → findById (incluye relaciones permissions cuando proceda).
  - users.integration: register; assignRoles; flujo completo permission → role → user → canDo y limpieza posterior.

2. Errores que surgieron y su análisis (solo los relacionados con estos integration tests)

- Error A — "Nest could not find PermissionsService element (this provider does not exist in the current context)"

  - Cuándo ocurrió: al ejecutar las pruebas de integración, durante la obtención del servicio con `app.get('PermissionsService')`.
  - Causa raíz: se intentó resolver el provider por una cadena (`'PermissionsService'`) en vez de por la clase/token real. En Nest, los providers se registran por la clase/token (a menos que se haya registrado explícitamente con un token string).

- Error B — "Cannot find module 'src/jwt/jwt.service'" (resolución de paths en Jest)

  - Cuándo ocurrió: al arrancar Jest, algunas importaciones con alias `src/...` no resolvían en el entorno de Jest/ts-jest.
  - Causa raíz: Jest no conocía los alias definidos por `tsconfig.json` (no hay mapeo por defecto para el alias `src`), por lo que la resolución fallaba.

- Error C — Tests no encontrados por Jest (No tests found)

  - Cuándo ocurrió: al ejecutar `jest --config test/jest-integration.json` en Windows.
  - Causa raíz: `rootDir` y `testRegex`/`testPathPattern` en la configuración no coincidían exactamente con la estructura/convención en Windows (se manejaron separadores de ruta). Esto provocó que Jest no detectara archivos en `test/integration`.

- Error D — Lógica incorrecta en `UsersService.findById` (falta de `await`)

  - Cuándo se detectó: durante la ejecución de tests que dependían de `findById` para arrojar NotFoundException cuando el usuario no existía.
  - Causa raíz: la función hacía `const user = this.repository.findOne(...)` sin `await`, por lo que `user` era una Promise y la comprobación `if (!user)` no funcionaba como se esperaba.

- Nota menor — ts-jest advertencia sobre `.js` files (allowJs)
  - Esto es un warning debido a una extensión de VSCode (Console Ninja) que inyecta código `.js` en el runtime. No afecta a la lógica de los tests, pero genera ruido en la salida.

3. Soluciones aplicadas (pasos concretos y commits/edits relevantes)

- Solución al Error A (PermissionsService not found):

  1. Cambiamos la obtención del provider en el test de usar cadena por la clase: `app.get(PermissionsService)`.
  2. Añadimos la importación de `PermissionsService` en `test/integration/users.integration.spec.ts`.

  - Resultado: Nest resolvió correctamente el provider desde el contexto del TestModule.

- Solución al Error B (alias src/... no resuelto por Jest):

  1. Añadimos `moduleNameMapper` en `test/jest-integration.json` y `test/jest-e2e.json`:
     - "^src/(.\*)$": "<rootDir>/src/$1"
  2. Alternativamente, ejecutamos Jest con `node -r tsconfig-paths/register -r ts-node/register node_modules/jest/bin/jest.js ...` para que tsconfig-paths habilite el alias en tiempo de ejecución.

  - Resultado: las importaciones `src/...` se resolvieron y los errores desaparecieron.

- Solución al Error C (Jest no encontraba tests):

  1. Ajustamos `test/jest-integration.json` para tener `rootDir` coherente y un `testRegex` que matchee archivos `integration.*.spec.ts` de forma robusta en Windows (considerando separadores). Se probó iterativamente hasta que Jest encontró las pruebas.

  - Resultado: Jest detectó y ejecutó las pruebas de `test/integration`.

- Solución al Error D (await faltante en UsersService.findById):

  1. Corregimos `src/users/users.service.ts` cambiando `const user = this.repository.findOne(...)` por `const user = await this.repository.findOne(...)`.

  - Resultado: la función ahora lanza `NotFoundException` correctamente cuando no existe el usuario, y los tests que esperan ese comportamiento pasan o fallan de forma coherente.

- Solución al test de delete en permissions:
  1. Actualizamos el test para esperar que `findById` rechace (porque el servicio lanza NotFoundException) en vez de esperar `null`.
  - Resultado: test delete ahora asertiva correctamente el comportamiento del servicio.

4. Verificación y resultados

- Ejecutamos los tests de integración con:
  - `node -r tsconfig-paths/register -r ts-node/register node_modules/jest/bin/jest.js --config test/jest-integration.json --runInBand --colors`
- Resultado final en este entorno:
  - Test Suites: 3 passed, 3 total
  - Tests: 7 passed, 7 total

5. Recomendaciones y buenas prácticas (prevención de regresiones)

- Evitar `app.get('SomeService')` con strings: usar siempre la clase o el token con el que se registró el provider (`app.get(MyService)`), a menos que exista un token explícito.
- Añadir un pequeño sanity test que compruebe que los providers principales están disponibles en el TestModule (por ejemplo `expect(app.get(PermissionsService)).toBeDefined()`); esto detecta temprano problemas de wiring.
- Documentar la convención de tests: Integration → `test/integration/*.spec.ts`; E2E → `test/*.e2e-spec.ts`. Ya se actualizó la documentación correspondiente.
- Para proyectos con alias (`src/...`) mantener `moduleNameMapper` en las configuraciones de Jest o usar `tsconfig-paths` cuando se ejecute Jest en CI para evitar discrepancias entre entornos.

6. Archivos cambiados (resumen)

- `src/users/users.service.ts` — agregar `await` en `findById`.
- `test/integration/users.integration.spec.ts` — usar `app.get(PermissionsService)` e importar la clase.
- `test/integration/permissions.integration.spec.ts` — test delete actualizado para esperar rechazo.
- `test/jest-integration.json` y `test/jest-e2e.json` — `moduleNameMapper` agregado y ajustes en `testRegex`/`rootDir` para Windows.
- `docs/permissions.integration.spec.explanation.md`, `docs/roles.integration.spec.explanation.md`, `docs/users.integration.spec.explanation.md` — explicaciones generadas línea a línea.

Conclusión

Las pruebas de integración ahora ejercitan la aplicación real mediante `AppModule`, usan exclusivamente las APIs públicas de los servicios, y pasan en este entorno. Los errores detectados fueron de configuración y de pequeñas inconsistencias en el código (resolución de providers, alias de importación y un `await` faltante). Aplicando las correcciones indicadas, validamos la ejecución correcta de las suites de integración.
