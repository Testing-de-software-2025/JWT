import { Controller, Get, Headers } from '@nestjs/common';
import { RefreshService } from './refresh.service';

@Controller('refresh')
export class RefreshController {
    constructor(private readonly refresh: RefreshService) {}
    
    @Get()
    async refreshToken(@Headers('refresh-token') refreshToken: string) {
        console.log(refreshToken)
        return await this.refresh.refreshToken(refreshToken);
    }
}