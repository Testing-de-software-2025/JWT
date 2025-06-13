import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDTO } from 'src/interfaces/login.dto';
import { compareSync } from 'bcrypt';
import { JwtService } from 'src/jwt/jwt.service';
import * as moment from 'moment';

@Injectable()
export class LoginService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async login(body: LoginDTO) {
        const user = await this.usersService.findByEmail(body.email);
        if (!user) {
            throw new UnauthorizedException();
        }
        const compareResult = compareSync(body.password, user.password);

        if (!compareResult) {
            throw new UnauthorizedException();
        }

        return {
            accessToken: this.jwtService.generateToken({ email: user.email }),
            refreshToken: this.jwtService.generateToken({ email: user.email }, 'refresh',),
            expirationTime: moment().add(10, 'minutes').toDate(),
        };
    }
}
