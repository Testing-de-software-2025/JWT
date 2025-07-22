
// Punto de entrada principal de la aplicación NestJS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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

  // Inicia el servidor en el puerto 3001
  await app.listen(3001);
}

// Ejecuta la función bootstrap
bootstrap();
