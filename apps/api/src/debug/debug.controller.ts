import { Controller, Get, Param, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as fs from 'fs';

@Controller('debug')
export class DebugController {
    constructor(private usersService: UsersService) { }

    @Get('user/:email')
    async findUser(@Param('email') email: string) {
        const user = await this.usersService.findByEmail(email);
        return user || { message: 'Usuário não encontrado' };
    }

    @Get('webhook-logs')
    getLogs() {
        const logPath = '/tmp/abacatepay-webhook.log';
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf8');
        }
        return 'Nenhum log encontrado em ' + logPath;
    }

    @Get('test-log')
    testLog() {
        const logPath = '/tmp/abacatepay-webhook.log';
        fs.appendFileSync(logPath, `[TEST] ${new Date().toISOString()} - Endpoint de teste acessado\n`);
        return 'Log de teste gravado';
    }
}
