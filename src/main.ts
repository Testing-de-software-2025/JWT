
// Punto de entrada principal de la aplicación NestJS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware';

// Función bootstrap para iniciar la app
async function bootstrap() {
  // Crea la instancia de la aplicación con el módulo principal
  const app = await NestFactory.create(AppModule);
  // Habilita CORS para permitir peticiones desde el frontend
  app.enableCors();

  // Aplica validaciones globales a los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Elimina propiedades no declaradas en el DTO
    forbidNonWhitelisted: true,// Rechaza requests con campos extra
    transform: true,           // Convierte payloads a instancias de clases DTO
    skipMissingProperties: false, // Marca como error si falta cualquier propiedad requerida
  }));

  // Helmet: cabeceras de seguridad incluidas (CSP, HSTS, etc.)
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Ajustá según lo que tu frontend necesite (por ejemplo si cargás scripts desde CDNs)
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", 'data:'],
      },
    },
  }));

  // Sanitizar entradas HTTP para prevenir XSS (req.body, query, params)
  app.use(sanitizeMiddleware);

  // Inicia el servidor en el puerto indicado por la variable de entorno PORT o 3001 por defecto
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

// Ejecuta la función bootstrap
bootstrap();
