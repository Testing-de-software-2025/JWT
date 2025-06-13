import { Controller, Get, Query, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly AppService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return 'status:Hola loquito todo correcto, aguante el dortmund';
  }
  
  @Get('version/:type')
  getVersion(
    @Query() query: { all?: boolean },
    @Param() params:{type:string}
  ): string | {number:number;date:Date;creator:string} {
    return this.AppService.getVersion(query);
  }
}
