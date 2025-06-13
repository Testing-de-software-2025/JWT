import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  controllers: [LoginController],
  providers: [LoginService],
  imports: [UsersModule, JwtModule],
})
export class LoginModule {}
