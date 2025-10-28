# Explicación profunda (línea por línea) de `src/jwt/jwt.service.spec.ts`

Este documento explica en detalle el archivo de pruebas `src/jwt/jwt.service.spec.ts`, línea por línea, y analiza si la suite es un test unitario apropiado. También incluye recomendaciones para mejorar su robustez y cobertura.

---

## Código original

```typescript
import { JwtService } from "./jwt.service";

describe("JwtService", () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
  });

  it("debería estar definido", () => {
    expect(service).toBeDefined();
  });

  it("debería generar un token JWT válido", () => {
    const payload = { email: "test@example.com" };
    const token = service.generateToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
  });

  it("debería verificar un token válido", () => {
    const payload = { email: "test@example.com" };
    const token = service.generateToken(payload);
    const decoded = service.verifyToken(token);
    expect(decoded.email).toBe(payload.email);
  });

  it("debería lanzar error al verificar un token inválido", () => {
    expect(() => service.verifyToken("token_invalido")).toThrow();
  });
});
```

---

## Explicación línea por línea y por bloques

1. `import { JwtService } from './jwt.service';`

   - Importa la clase `JwtService` que provee la lógica de generación y validación de JWT.

2. `describe('JwtService', () => {`

   - Comienza la suite de pruebas para `JwtService`.

3. `  let service: JwtService;`
   - Declara la variable `service` que contendrá la instancia del servicio bajo prueba.

6-8. `  beforeEach(() => {
    service = new JwtService();
  });`

- Antes de cada test se crea una instancia nueva de `JwtService`. Esto garantiza aislamiento entre tests respecto del estado de la instancia.
- Nota: `JwtService` utiliza internamente `jsonwebtoken` y `dayjs` (ver `src/jwt/jwt.service.ts`). Aquí se instancia la implementación real, por lo que los tests dependen de esas librerías.

10-12. `  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });`

- Test muy básico que comprueba que la instancia existe.

14-20. `  it('debería generar un token JWT válido', () => {
  const payload = { email: 'test@example.com' };
  const token = service.generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });`

- Genera un token usando `generateToken` con `payload` simple.
- Verifica que `token` es una string y tiene longitud mayor que 10 (chequeo simple de plausibilidad).
- Mejora: comprobar que `verify` puede decodificar el token o mockear `sign` para controlar la salida.

22-28. `  it('debería verificar un token válido', () => {
  const payload = { email: 'test@example.com' };
  const token = service.generateToken(payload);
  const decoded = service.verifyToken(token);
  expect(decoded.email).toBe(payload.email);
  });`

- Genera un token y lo verifica inmediatamente con `verifyToken`.
- Verifica que el payload decodificado contiene el email original. Esto prueba la consistencia `generateToken` <-> `verifyToken`.

30-32. `  it('debería lanzar error al verificar un token inválido', () => {
  expect(() => service.verifyToken('token_invalido')).toThrow();
  });`

- Verifica que `verifyToken` arroja cuando se le pasa una cadena que no es un token válido.
- Este test valida manejo de errores en la verificación.

---

## Evaluación: ¿es un test unitario?

- Técnicamente los tests son "unitarios" porque prueban la unidad `JwtService` aislada de otras partes del sistema. Sin embargo, se instancia la implementación real que utiliza `jsonwebtoken` y `dayjs`, por lo que hay dependencia directa de librerías externas durante la ejecución.
- Esto los convierte en pruebas unitarias con dependencia de librerías externas o en pruebas de integración ligera. Para ser tests unitarios puros se recomienda mockear `jsonwebtoken` y `dayjs`.

## Buenas prácticas aplicadas

- Uso de `beforeEach` para aislar estado entre tests.
- Tests claros y cortos que prueban comportamiento específico (generación, verificación, error).

## Oportunidades de mejora (recomendaciones)

1. Mockear `jsonwebtoken`.

   - Ventajas: controlas los valores retornados por `sign` y `verify`, haces tests más rápidos y menos frágiles.
   - Ejemplo:
     ```ts
     jest.mock("jsonwebtoken", () => ({
       sign: jest.fn(() => "TOKEN_MOCK"),
       verify: jest.fn(() => ({
         email: "test@example.com",
         exp: Math.floor(Date.now() / 1000) + 60,
       })),
     }));
     ```

2. Mockear `dayjs` para `refreshToken` (si pruebas esa función).

   - Permite simular diferentes tiempos restantes y probar las ramas `timeToExpire < 5` y `>= 5`.

3. Añadir tests para `refreshToken`.

   - Casos:
     - refreshToken válido y con tiempo > 5 => devuelve el mismo refresh token.
     - refreshToken válido y con tiempo < 5 => genera uno nuevo.
     - refreshToken inválido => lanza `UnauthorizedException`.

4. Comprobar interacciones internas y llamadas.

   - Por ejemplo, si mockeas `sign`, verifica que fue llamado con el payload y el secreto correctos.

5. Evitar aserciones débiles como `token.length > 10`.
   - Preferir verificar que `verify` puede decodificar o que `sign` fue llamado correctamente (cuando mockeado).

## Ejemplo de tests con mocks (esqueleto)

```ts
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "TOKEN_MOCK"),
  verify: jest.fn((token, secret) => ({
    email: "test@example.com",
    exp: Math.floor(Date.now() / 1000) + 60,
  })),
}));

import { JwtService } from "./jwt.service";

describe("JwtService (con jsonwebtoken mockeado)", () => {
  let service: JwtService;
  beforeEach(() => {
    service = new JwtService();
  });

  it("genera token llamando sign", () => {
    const token = service.generateToken({ email: "a@b.com" });
    expect(token).toBe("TOKEN_MOCK");
    // Aquí podrías comprobar que sign fue llamado con el secret correcto
  });
});
```

---

## Conclusión

- La suite actual es válida para comprobar comportamientos básicos, pero para ser más robusta y alineada con unit testing puro, recomendaría mockear `jsonwebtoken` y `dayjs` y añadir tests para `refreshToken`.
- Si querés, puedo:
  - (A) Generar la versión mockeada del spec (`src/jwt/jwt.service.spec.ts`) y añadir tests para `refreshToken`, o
  - (B) Mantener la suite actual pero añadir tests adicionales sin mockear (menor aislamiento).

Dime cuál prefieres y aplico los cambios.
