# Documentación: test/permissions.integration.e2e-spec.ts

A continuación se presenta la documentación en español del archivo `test/permissions.integration.e2e-spec.ts`.
Incluye un resumen general y una explicación línea por línea.

---

## Resumen general

`test/permissions.integration.e2e-spec.ts` es una prueba de integración tipo end-to-end (e2e) para el recurso "permissions" de la aplicación NestJS. La prueba arranca una instancia del módulo principal (`AppModule`), limpia la tabla de permisos en la base de datos (usando TRUNCATE ... CASCADE para Postgres), realiza una petición HTTP para crear un permiso y luego solicita la lista de permisos para verificar que el permiso creado está presente. El archivo usa Jest como framework de tests y Supertest para hacer solicitudes HTTP contra el servidor NestJS en memoria.

Propósito principal:
- Validar que la ruta POST /permissions crea un permiso.
- Validar que la ruta GET /permissions/all lista los permisos y contiene el creado.
- Ejecutarse contra la base de datos configurada por `AppModule` (por eso se limpia la tabla con TRUNCATE).

Precauciones:
- El `TRUNCATE TABLE ... CASCADE` es destructivo: borra datos y debe usarse solo en entornos de testing.
- El test asume que las rutas existen y que las respuestas siguen el contrato esperado (201 en creación, 200 en listado).

---

## Explicación línea por línea

A continuación se muestra cada línea (aproximada a la versión actual del archivo) y su explicación.

1. `import { Test, TestingModule } from '@nestjs/testing';`
- Importa utilidades de NestJS para crear un módulo de pruebas (`TestingModule`) y helpers (`Test`) para construir el entorno de testing.

2. `import { INestApplication } from '@nestjs/common';`
- Importa la interfaz `INestApplication` que representa una instancia de la aplicación Nest (útil para tipar la variable `app`).

3. `import * as request from 'supertest';`
- Importa la librería `supertest` para realizar peticiones HTTP sobre el servidor Express/Nest en memoria (se usa para las llamadas .post/.get).

4. `import { AppModule } from './../src/app.module';`
- Importa el módulo principal de la aplicación (`AppModule`). En las pruebas e2e se arranca este módulo para tener la app completa con controladores, providers y conexiones a BD.

5. `import { DataSource } from 'typeorm';`
- Importa `DataSource` de TypeORM; se obtiene del contenedor de Nest para manipular la base de datos (limpieza, queries directas).

6. `import { PermissionEntity } from '../src/entities/permission.entity';`
- Importa la entidad `PermissionEntity` que representa la tabla `permissions` en la base de datos; se usa para obtener repositorio o para limpiar datos (en versiones previas se usaba .clear()).

7. (línea en blanco)
- Separador visual entre imports y el bloque de tests.

8. `describe('Permissions integration (e2e)', () => {`
- Inicio del bloque de Jest `describe` que agrupa las pruebas e2e relacionadas con permisos. El string describe el conjunto de pruebas.

9. `  let app: INestApplication;`
- Declara la variable `app` (tipo `INestApplication`) que contendrá la instancia de la aplicación Nest iniciada por los tests.

10. `  let httpServer: any;`
- Declara `httpServer`, se usará para guardar el servidor HTTP obtenido por `app.getHttpServer()` y pasarlo a `supertest`.

11. `  let dataSource: DataSource;`
- Declara `dataSource`, la conexión de TypeORM que se recupera desde el contenedor de Nest para ejecutar queries directas (limpieza TRUNCATE).

12. (línea en blanco)
- Separador antes del beforeAll.

13. `  beforeAll(async () => {`
- Hook de Jest que se ejecuta antes de todas las pruebas del bloque `describe`. Se usa para inicializar la app y preparar DB.

14. `    const moduleFixture: TestingModule = await Test.createTestingModule({`
- Crea un `TestingModule` usando `Test.createTestingModule`. `moduleFixture` contendrá el módulo de pruebas compilado. Este paso prepara el módulo similar a cómo Nest inicializa el app real.

15. `      imports: [AppModule],`
- Indica que se importa `AppModule` dentro del `TestingModule`, lo que monta toda la aplicación (controladores, servicios, TypeORM, etc.) para la prueba.

16. `    }).compile();`
- Compila el `TestingModule`, devolviendo un módulo listo para crear una instancia de la app.

17. (línea en blanco)
- Separador visual.

18. `    app = moduleFixture.createNestApplication();`
- Crea una instancia de la aplicación Nest a partir del módulo de pruebas (`moduleFixture`).

19. `    await app.init();`
- Inicializa la aplicación (arranca middleware, inicializa providers, etc.). Es necesario antes de obtener `httpServer` o hacer peticiones.

20. (línea en blanco)
- Separador.

21. `    httpServer = app.getHttpServer();`
- Obtiene el servidor HTTP (Express) asociado a la app para pasarlo a `supertest` y realizar peticiones.

22. `    dataSource = app.get(DataSource);`
- Recupera el `DataSource` de TypeORM que la aplicación inyectó en el contenedor (el que AppModule configuró). Permite ejecutar queries directas.

23. (línea en blanco)
- Separador.

24. `  // Limpiar usando TRUNCATE CASCADE para Postgres y reiniciar identities`
- Comentario explicativo: indica que a continuación se hace una limpieza de la tabla con TRUNCATE ... CASCADE (recomendado para Postgres cuando hay FK).

25. `  await dataSource.query('TRUNCATE TABLE "permissions" RESTART IDENTITY CASCADE');`
- Ejecuta una query SQL directa que trunca la tabla `permissions`, reinicia sus sequences (IDs) y aplica CASCADE para eliminar datos relacionados por FK. Esto garantiza que la tabla esté vacía antes de correr la prueba. Nota: destructivo en la BD.

26. `  }, 20000);`
- Cierre del `beforeAll`. El `20000` es el timeout (20s) que Jest permite para ejecutar `beforeAll` antes de fallar por timeout.

27. (línea en blanco)
- Separador.

28. `  afterAll(async () => {`
- Hook `afterAll` que se ejecuta después de todas las pruebas; sirve para limpiar y cerrar la app.

29. `    if (dataSource) await dataSource.query('TRUNCATE TABLE "permissions" RESTART IDENTITY CASCADE');`
- Si `dataSource` está definido, se trunca nuevamente la tabla `permissions` para dejar la BD limpia al terminar (y reiniciar identities). Evita dejar datos residuales.

30. `    await app.close();`
- Cierra la aplicación Nest (libera servidor, conexiones a BD y recursos). Importante para que Jest pueda terminar sin handles abiertos.

31. `  });`
- Cierre del `afterAll`.

32. (línea en blanco)
- Separador.

33. `  it('should create and list permissions', async () => {`
- Inicio de la prueba individual (test case) con descripción. Es una prueba asíncrona.

34. `    const permission = { name: `perm_${Date.now()}` };`
- Crea un objeto `permission` con un nombre único usando `Date.now()` para evitar colisiones con datos existentes.

35. (línea en blanco)

36. `    const createRes = await request(httpServer)`
- Inicia la petición con `supertest` usando `httpServer`; `createRes` guardará la respuesta de la creación.

37. `      .post('/permissions')`
- Método y ruta: envía POST a `/permissions` (endpoint que debe crear un permiso).

38. `      .send(permission);`
- Envía el body `permission` con la petición POST.

39. (línea en blanco)

40. `    if (createRes.status === 201) {`
- Comprueba si la respuesta fue status 201 (creado). El test permite no fallar si la ruta requiere autenticación y devuelve 401 en entornos protegidos; solo valida contenido cuando la creación fue exitosa.

41. `      expect(createRes.body).toHaveProperty('id');`
- Si se creó correctamente, se espera que el body incluya la propiedad `id` del permiso creado.

42. (línea en blanco)

43. `      const listRes = await request(httpServer)`
- Realiza otra petición para obtener la lista de permisos.

44. `        .get('/permissions/all')`
- Ruta GET que debe devolver todos los permisos.

45. `        .expect(200);`
- Aserta que la respuesta del listado tenga HTTP 200.

46. (línea en blanco)

47. `      expect(listRes.body.find((p: any) => p.name === permission.name)).toBeTruthy();`
- Busca en el body (lista de permisos) un elemento cuyo nombre coincida con el creado y espera que exista (truthy).

48. `    }`
- Cierre de la condición `if`.

49. `  }, 20000);`
- Cierre del `it` (test). El `20000` es el timeout (20s) permitido para este test.

50. `});`
- Cierre del bloque `describe`.

---

## Notas adicionales y recomendaciones

- Ejecutar el test:
  - Desde PowerShell (repositorio en la raíz) puedes ejecutar un único e2e así:

```powershell
node node_modules/jest/bin/jest.js --config ./test/jest-e2e.json --rootDir=. test/permissions.integration.e2e-spec.ts --runInBand
```

  - o usando npm script:

```powershell
npm run test:e2e -- test/permissions.integration.e2e-spec.ts --runInBand
```

- Sobre la limpieza con TRUNCATE:
  - `dataSource.query('TRUNCATE TABLE "permissions" RESTART IDENTITY CASCADE')` es específico de Postgres. Si cambias a sqlite in-memory en tests, la query fallará — en ese caso usa `repository.clear()` o adapta según DB.
  - TRUNCATE con CASCADE borra también registros relacionados en tablas con FK hacia `permissions`. Asegúrate de no correr e2e en una BD de producción por accidente.

- Sobre autenticación:
  - El test asume que POST /permissions crea sin autenticación; si tu app requiere token, la creación devolverá 401 y el test simplemente no ejecutará los asserts adicionales. Si quieres forzar creación, agrega headers con token o prepara un usuario admin en el beforeAll.

- Edge cases:
  - Si la ruta `/permissions/all` devuelve paginación u otro formato, la búsqueda en `listRes.body.find(...)` puede fallar; adapta la aserción al formato real.
  - Si la API responde con diferente forma de body, ajustar `expect(createRes.body).toHaveProperty('id')` según el contrato.

---

### Guía rápida de lectura

- Inicialización: líneas 13–22 configuran y arrancan la app.
- Limpieza DB: líneas 24–25 y 29 ejecutan TRUNCATE para asegurar un estado limpio.
- Test: líneas 33–49 crean un permiso y verifican que aparezca en el listado.

---

Si querés, puedo también:
- Generar un `README.md` con la explicación anterior y los comandos para ejecutar los tests.
- Añadir autenticación al test (obtener token válido en beforeAll y usarlo en POST).
- Revertir la consulta TRUNCATE a `.clear()` y ajustar para sqlite si preferís una DB en memoria para e2e.

Dime si querés alguno de esos cambios y lo hago.
