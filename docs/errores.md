# Registro de error: "Nest could not find PermissionsService element"

Fecha: 27 de octubre de 2025

Resumen corto

Durante la ejecución de las pruebas de integración con Jest apareció el siguiente error en la suite `Users integration tests`:

> Nest could not find PermissionsService element (this provider does not exist in the current context)

Este documento explica qué pasó, la causa raíz, y cómo lo solucionamos paso a paso.

Descripción del error

El fallo ocurrió cuando el test intentó obtener el `PermissionsService` desde el `INestApplication` del TestModule con:

```ts
const permissionsService = app.get("PermissionsService") as any;
```

La excepción lanzada por NestJS fue exactamente: "this provider does not exist in the current context". El stack trace apuntaba a `test/integration/users.integration.spec.ts` y a la resolución de providers de Nest (`instance-links-host.js`).

Causa raíz

1. Uso de token incorrecto para obtener el provider desde el contexto de Nest.

   - En NestJS los proveedores se registran por defecto por su clase (o por un token explícito si se registra). Usar `app.get('PermissionsService')` intenta resolver por la cadena `'PermissionsService'`, que no coincide con la clase/token real.
   - Por eso Nest no encuentra el provider y lanza la excepción.

2. (Relacionado) Durante la ejecución también abordamos otros problemas que aparecieron en la misma sesión y que impedían ejecutar las pruebas con normalidad:
   - Las importaciones aliased `src/...` no resolvían en Jest; provocaron errores del tipo "Cannot find module 'src/jwt/jwt.service'". Se resolvió añadiendo `moduleNameMapper` y/o ejecutando Jest con `tsconfig-paths` y `ts-node`.
   - Un bug en `UsersService.findById` (falta de `await`) hacía que la lógica de NotFoundException fuese incorrecta. Se corrigió agregando `await`.

Cómo lo solucionamos (pasos aplicados)

1. Reemplazamos la obtención del provider por la forma correcta usando la clase como token:

Antes (incorrecto):

```ts
const permissionsService = app.get("PermissionsService") as any;
```

Después (correcto):

```ts
import { PermissionsService } from "../../src/permissions/permissions.service";
const permissionsService = app.get(PermissionsService) as any;
```

2. Aseguramos que el `PermissionsService` esté exportado/importado correctamente en el `AppModule` (en este proyecto `PermissionsService` ya estaba listado en `providers` de `AppModule`, por eso solo fue un problema de token de búsqueda en el test).

3. Resolvimos problemas de resolución de paths en Jest:
   - Añadimos `moduleNameMapper` a `test/jest-integration.json` y `test/jest-e2e.json` para mapear `^src/(.*)$` → `<rootDir>/src/$1`.
   - Alternativamente, ejecutamos Jest con:

```
node -r tsconfig-paths/register -r ts-node/register node_modules/jest/bin/jest.js --config test/jest-integration.json --runInBand --colors
```

4. Corregimos pequeños errores en tests y servicios que aparecieron durante la corrida:
   - `UsersService.findById`: agregamos `await` a la llamada a `repository.findOne(...)`.
   - `test/integration/permissions.integration.spec.ts`: el test de delete fue actualizado para esperar que `findById` rechace (NotFoundException) en lugar de devolver `null`.
   - Ajustamos `test/jest-integration.json` (`testRegex` / `rootDir`) para que Jest encuentre correctamente los archivos de test en Windows.

Verificación

Después de los cambios ejecutamos las pruebas de integración con el comando señalado arriba. Resultado:

- Test Suites: 3 passed, 3 total
- Tests: 7 passed, 7 total

Esto confirmó que la causa real del error inicial era el token de resolución del provider (`app.get('PermissionsService')`) y que las demás correcciones eliminaron errores colaterales durante la ejecución.

Buenas prácticas y recomendaciones

- Cuando obtengas providers desde el contexto de Nest en tests, usa la clase o el token explícito con el que fue registrado el provider: `app.get(MyService)` o `app.get(MY_TOKEN)`.
- Si tu proyecto usa alias `src/...` asegúrate de que Jest pueda resolverlos: usa `moduleNameMapper` o ejecuta Jest con `tsconfig-paths` y `ts-node`.
- Prefiere no usar strings mágicas para `app.get(...)` salvo que el provider se haya registrado explícitamente con ese string como token.
- Añade tests que verifiquen los flujos de inicialización del TestModule en caso de módulos grandes (sanity check de providers) — un test pequeño que haga `expect(app.get(SomeService)).toBeDefined()` ayuda a detectar problemas temprano.

Entradas relacionadas (archivos que cambiamos)

- `test/integration/users.integration.spec.ts` — reemplazo de `app.get('PermissionsService')` por `app.get(PermissionsService)`.
- `src/users/users.service.ts` — añadido `await` en `findById`.
- `test/jest-integration.json` y `test/jest-e2e.json` — añadido `moduleNameMapper` para resolver `src/...`.
- `test/integration/permissions.integration.spec.ts` — ajuste del test de delete.

Si querés, puedo crear un pequeño test adicional que valide que los providers principales están presentes en el TestModule (sanity check) y así prevenir regresiones de este tipo.

---

Si necesitás que documente esto en otro formato (ticket, commit message o PR), decímelo y lo preparo.

Fin del registro de errores
