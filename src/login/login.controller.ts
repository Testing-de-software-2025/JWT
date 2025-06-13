import { Controller } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { LoginDTO } from 'src/interfaces/login.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
    constructor(private loginService: LoginService) {}
    @Post()
    login(@Body() body: LoginDTO) {
        return this.loginService.login(body);
    }
}
