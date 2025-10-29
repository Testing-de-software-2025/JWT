# Cambios: fragmentos "antes" y "después" con explicación

Fecha: 28 de octubre de 2025

Este documento recopila los fragmentos de código que inicialmente producían errores durante la ejecución de las pruebas de integración, junto con la versión corregida y una breve explicación.

---

1. Error: obtención del provider con token string

Antes (error):

```ts
// test/integration/users.integration.spec.ts (versión inicial con error)
// ERROR: Nest could not find PermissionsService element
const permissionsService = app.get("PermissionsService") as any;
```

Después (corrección):

```ts
// test/integration/users.integration.spec.ts (corregido)
import { PermissionsService } from "../../src/permissions/permissions.service";
const permissionsService = app.get(PermissionsService) as any;
```

Por qué: `app.get` resuelve providers por la clase o por el token con el que fueron registrados. Usar una cadena sólo funciona si el provider se registró explícitamente con ese token string. Cambiar a la clase garantiza que Nest encuentre el provider en el contexto del TestModule.

---

2. Error: falta `await` en `UsersService.findById`

Antes (error):

```ts
// src/users/users.service.ts (versión inicial con error)
async findById(id: number): Promise<UserEntity> {
  const user = this.repository.findOne({where: {id}, relations: ["roles","roles.permissions"], select: ["id", "email", "roles"]});
  if(!user) {
    throw new NotFoundException('El usuario no existe');
  }
  return user;
}
```

Después (corrección):

```ts
// src/users/users.service.ts (corregido)
async findById(id: number): Promise<UserEntity> {
  const user = await this.repository.findOne({where: {id}, relations: ["roles","roles.permissions"], select: ["id", "email", "roles"]});
  if(!user) {
    throw new NotFoundException('El usuario no existe');
  }
  return user;
}
```

Por qué: sin `await` la variable `user` era una Promise, por lo que la comprobación `if (!user)` no detectaba correctamente la ausencia del usuario y la excepción no se lanzaba cuando correspondía.

---

3. Error: expectation equivocada en test de delete (permissions)

Antes (error):

```ts
// test/integration/permissions.integration.spec.ts (versión inicial con error)
await permissionsService.delete(permission.id);
const found = await permissionsService.findById(permission.id);
expect(found).toBeNull();
```

Después (corrección):

```ts
// test/integration/permissions.integration.spec.ts (corregido)
await permissionsService.delete(permission.id);
// findById throws NotFoundException when not found — assert the promise rejects
await expect(permissionsService.findById(permission.id)).rejects.toBeDefined();
```

Por qué: `PermissionsService.findById` está diseñado para lanzar `NotFoundException` cuando la entidad no existe; por tanto, la prueba debe esperar que la promesa rechace, no que devuelva `null`.

---

4. Error: uso directo del repositorio en tests de integration (convertido a uso de servicios)

Antes (error / anti-pattern):

```ts
// test/integration/users.integration.spec.ts (versión inicial)
// create permission directamente en el repositorio
const perm = await dataSource
  .getRepository("permissions")
  .save({ name: `p_${Date.now()}` });
```

Después (corrección):

```ts
// test/integration/users.integration.spec.ts (corregido)
const permissionsService = app.get(PermissionsService) as any;
const perm = await permissionsService.create({
  name: `p_${Date.now()}`,
} as any);
```

Por qué: las pruebas de integración debían usar solamente las APIs públicas de los servicios (no tocar repositorios directamente). Esto mejora el encapsulamiento y prueba el comportamiento real del servicio.

---

5. Error: Jest no resolvía alias `src/...` y no encontraba módulos

Antes (config / problema):

```json
// test/jest-integration.json (versión inicial)
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": "integration\\/.*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

Problema observado: imports como `src/jwt/jwt.service` no resolvían y Jest fallaba con "Cannot find module 'src/jwt/jwt.service'".

Después (corrección):

```json
// test/jest-integration.json (corregido)
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": "integration.*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": { "^src/(.*)$": "<rootDir>/src/$1" }
}
```

Adicionalmente, en la ejecución local se usó:

```
node -r tsconfig-paths/register -r ts-node/register node_modules/jest/bin/jest.js --config test/jest-integration.json --runInBand --colors
```

Por qué: `moduleNameMapper` permite que Jest resuelva importaciones con prefijo `src/`. Ejecutar Jest con `tsconfig-paths` también soluciona el mapeo en tiempo de ejecución.

---

6. Error: Jest no encontraba tests (testRegex/rootDir en Windows)

Antes (config problemática):

```json
// test/jest-integration.json (versión inicial)
{
  "rootDir": "..",
  "testRegex": "test\\/integration\\/.*\\.spec\\.ts$"
}
```

Después (corrección iterativa):

```json
// test/jest-integration.json (final)
{
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": "integration.*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": { "^src/(.*)$": "<rootDir>/src/$1" }
}
```

Por qué: en Windows las barras invertidas afectan los patrones; se eligió una expresión más tolerante (`integration.*\.spec\.ts`) que encuentre los archivos independientemente del separador y ubicación relativa.

---

7. Nota sobre advertencia ts-jest

Mensaje observado:

```
ts-jest[ts-compiler] (WARN) Got a `.js` file to compile while `allowJs` option is not set to `true` (file: C:\Users\Usuario\.vscode\extensions\...)
```

Acción: es una advertencia generada por una extensión que inyecta un archivo .js. No es crítica para la ejecución de tests. Si se desea eliminar la advertencia, se puede:

- Establecer `allowJs: true` en `tsconfig.json` (compilaría .js con ts-jest), o
- Excluir la ruta de la extensión o ajustar `transform` para no emparejar `.js`.

---

Resumen final

La mayoría de los problemas fueron de configuración (resolución de providers por token, mapeo de paths en Jest, patrones de test) y una pequeña bug en el código (`await` faltante). Tras las correcciones, las pruebas de integración ejecutan y pasan correctamente.

Si querés, puedo:

- Crear un diff/PR con estos cambios listo para revisar.
- Agregar tests de sanity que verifiquen la presencia de providers en el TestModule.
- Ejecutar las pruebas E2E y traer la salida.

Fin del documento.
