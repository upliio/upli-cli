import commander from 'commander';
import {login} from '../user/UserService';

export const Login = commander.program.createCommand('login')
    .description('Login into upli account')
    .action(() => {
        login();
    });
