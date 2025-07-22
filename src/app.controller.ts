// Controlador principal para verificar el estado del microservicio
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  // Endpoint GET / para verificar que el microservicio está activo
  @Get()
  getHello(): string {
    return 'status:OK'; // Respuesta simple para monitoreo
  }
}