# Explicación profunda (línea por línea) de `src/users/user.service.spec.ts`

Este documento explica detalladamente el archivo de pruebas `src/users/user.service.spec.ts`. Incluye una explicación línea por línea, evaluación de buenas prácticas y recomendaciones para mejorar la suite de pruebas.

---

## Código original

```typescript
import { UsersService } from "./users.service";
import { JwtService } from "../jwt/jwt.service";
import { hashSync } from "bcrypt";

describe("UsersService", () => {
  let service: UsersService;
  let jwtService: JwtService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = new JwtService();
    const mockRolesService: any = { findById: jest.fn() };
    service = new UsersService(jwtService, mockRolesService);
    // Inyectar el repo mockeado en la instancia
    (service as any).repository = mockRepo;
  });

  it("debería registrar un usuario", async () => {
    const dto = { email: "test@example.com", password: "1234" };
    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });

    const result = await service.register(dto as any);
    // register devuelve { status: 'created' }
    expect(result).toHaveProperty("status", "created");
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it("debería loguear un usuario válido", async () => {
    const dto = { email: "test@example.com", password: "1234" };
    // Simular que findByEmail devuelve un usuario con la contraseña hasheada
    const hashed = hashSync(dto.password, 10);
    jest
      .spyOn(service, "findByEmail" as any)
      .mockResolvedValue({ id: 1, email: dto.email, password: hashed } as any);

    const result = await service.login(dto as any);
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  it("debería lanzar error con credenciales inválidas", async () => {
    jest.spyOn(service, "findByEmail" as any).mockResolvedValue(null);
    await expect(
      service.login({ email: "fail@example.com", password: "wrong" } as any)
    ).rejects.toThrow();
  });
});
```

---

## Explicación línea por línea y por bloques

1. `import { UsersService } from './users.service';`

   - Importa la clase `UsersService` que será probada.

2. `import { JwtService } from '../jwt/jwt.service';`

   - Importa `JwtService`, que la implementación real de `UsersService` usa para generar tokens. En esta suite se crea una instancia real de `JwtService` (ver discusión más abajo).

3. `import { hashSync } from 'bcrypt';`

   - Importa `hashSync` para generar un hash de contraseña válido y simular el usuario recuperado desde la base de datos con contraseña hasheada.

4. `describe('UsersService', () => {`
   - Define la suite de pruebas para `UsersService`.

6-8. `  let service: UsersService;
  let jwtService: JwtService;
  let mockRepo: any;`

- Declara variables compartidas entre tests: la instancia del servicio, el servicio JWT y el repositorio mockeado.

10. `  beforeEach(() => {`

- Prepara el estado antes de cada test.

11-15. `    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };`

- Mock del repositorio con métodos habituales (create, save, findOne).

16. `    jwtService = new JwtService();`

- Crea una instancia real de `JwtService`. Esto significa que los tests dependerán de la implementación de `JwtService` (uso de jsonwebtoken y dayjs). Es aceptable para tests de integración ligera, pero para unit tests estrictos es preferible mockear `JwtService`.

17. `  const mockRolesService: any = { findById: jest.fn() };`

- Mock mínimo de `RolesService` con `findById`.

18. `  service = new UsersService(jwtService, mockRolesService);`

- Instancia `UsersService` con `jwtService` real (ver nota) y el mock de roles.

19. `  // Inyectar el repo mockeado en la instancia
(service as any).repository = mockRepo;`

- Injerta manualmente el repositorio mockeado en la instancia. Esto sugiere que `UsersService` espera `repository` como propiedad (posiblemente inyectada por el framework). Inyectarlo así está bien en pruebas unitarias, aunque sería más elegante usar constructor injection o un factory para pasar todos los deps.

21. `  });`

- Cierra `beforeEach`.

23. `  it('debería registrar un usuario', async () => {`

- Test para `register`.

24. `    const dto = { email: 'test@example.com', password: '1234' };`

- DTO de registro.

25-26. `    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });`

- Configura comportamiento esperado del repo: `create` devuelve el DTO y `save` resuelve con la entidad guardada (incluido `id`).

28. `    const result = await service.register(dto as any);`

- Llama al método `register`.

29-30. `    // register devuelve { status: 'created' }
    expect(result).toHaveProperty('status', 'created');`

- Verifica que `register` retorna un objeto con `status: 'created'`. Esto comprueba la lógica de alto nivel del método.

31. `    expect(mockRepo.save).toHaveBeenCalled();`

- Verifica que se llamó al repositorio para guardar la entidad.

32. `  });`

- Cierra el test de register.

34. `  it('debería loguear un usuario válido', async () => {`

- Test para `login` con credenciales correctas.

35. `    const dto = { email: 'test@example.com', password: '1234' };`

- DTO de login.

36-37. `    // Simular que findByEmail devuelve un usuario con la contraseña hasheada
    const hashed = hashSync(dto.password, 10);`

- Calcula el hash de la contraseña para simular la contraseña almacenada en DB.

38. `    jest.spyOn(service, 'findByEmail' as any).mockResolvedValue({ id: 1, email: dto.email, password: hashed } as any);`

- Espía y mockea el método `findByEmail` del servicio para que devuelva un usuario con la contraseña hasheada. Esto evita tocar la base de datos y simula la búsqueda por email.

40. `    const result = await service.login(dto as any);`

- Invoca `login` con el DTO.

41-42. `    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');`

- Verifica que el login retorna ambos tokens.
- Nota: como `jwtService` es real, se generan tokens reales; si quisieras controlar los valores exactos, mockea `jwtService`.

44. `  });`

- Cierra el test de login válido.

46. `  it('debería lanzar error con credenciales inválidas', async () => {`

- Test para login con credenciales inválidas.

47. `    jest.spyOn(service, 'findByEmail' as any).mockResolvedValue(null);`

- Mockea `findByEmail` para que devuelva `null` (usuario no encontrado).

48-49. `    await expect(service.login({ email: 'fail@example.com', password: 'wrong' } as any))
      .rejects.toThrow();`

- Espera que `login` lance (rechace) al no encontrar usuario o por credenciales inválidas.

50. `  });`

- Cierra el test.

51. `});`

- Cierra el `describe`.

---

## Análisis y recomendaciones

1. ¿Es unitario? Sí, en su mayoría. Motivos:

   - Inyecta mocks del repositorio y espía `findByEmail` para evitar acceso a la base de datos.
   - Sin embargo, crea una instancia real de `JwtService`, lo que introduce una dependencia externa (jsonwebtoken/dayjs). Esto lo acerca a una prueba de integración ligera en lugar de un unit test puro.

2. Recomendaciones concretas

- Mockear `JwtService` en lugar de instanciarlo realmente. Así controlas el valor de `accessToken` y `refreshToken` y aislás por completo la prueba:

  ```ts
  const jwtServiceMock = {
    generateToken: jest.fn(() => "ACCESS"),
    generateRefreshToken: jest.fn(() => "REFRESH"),
  };
  service = new UsersService(jwtServiceMock as any, mockRolesService);
  ```

- Tipar `mockRepo` con `Partial<Repository<UserEntity>>` o `jest.Mocked` para mayor seguridad de tipos.

- En el test de `register`, además de comprobar `status`, verificar que `mockRepo.create` y `mockRepo.save` se llamaron con el DTO correcto y que el password fue hasheado antes de guardar (si eso lo maneja `register`).

- En el test de `login` válido, comprobar que `jwtService.generateToken` (o el método correspondiente) fue llamado con el payload correcto, y que los tokens devueltos provienen del mock (si decides mockear `JwtService`).

- Añadir tests para casos adicionales:
  - Registrar con email ya existente.
  - Login con contraseña incorrecta (usuario encontrado, password mismatch).
  - register lanza error si `save` falla.

3. Notas sobre inyección del repositorio

- Inyectar `(service as any).repository = mockRepo;` es un atajo válido en pruebas, pero considera pasar el repositorio por constructor o un factory para tener inyección explítica y más claridad.

---

## Conclusión

- La suite actual cubre los flujos básicos de registro y login y evita acceso a la base de datos mediante mocks/espías, por lo que funciona como suite de pruebas principalmente unitarias.
- Para ser más "puramente" unitaria y robusta, mockea `JwtService`, tipa los mocks, añade aserciones más estrictas y cubre errores y casos límite.

---

Archivo generado: `docs/user.service.spec.explanation.md`

Si querés, aplico los cambios sugeridos (mockear JwtService, añadir asserts) directamente en `src/users/user.service.spec.ts` y corro los tests que indiques.
