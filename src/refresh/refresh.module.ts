import { Module } from '@nestjs/common';
import { RefreshController } from './refresh.controller';
import { RefreshService } from './refresh.service';
import { JwtModule } from '../jwt/jwt.module';

@Module({
    controllers: [RefreshController],
    providers: [RefreshService],
    imports: [JwtModule]
})
export class RefreshModule {



}
