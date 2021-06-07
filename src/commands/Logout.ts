import commander from 'commander';
import {GLOBAL_CONFIG_FILE, writeConfig} from '../ConfigManager';
import {axiosInstance} from '../index';
import chalk from 'chalk';

export const Logout = commander.program.createCommand('logout')
    .description('Logout from upli account')
    .action(async () => {
        try {
            // invalidate session
            const res = await axiosInstance.post(`/api/auth/logout`);
            if (res.status == 200) {
                console.log(chalk.green(`Successfully logged out!`));
            }
        } catch (ex) {
            // ignore server error
            console.log(chalk.green('Token removed!'));
        }
        writeConfig(GLOBAL_CONFIG_FILE, {});
    });
