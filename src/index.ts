#!/usr/bin/env node


import {configExists, GLOBAL_CONFIG_FILE} from './ConfigManager';
import {program} from 'commander';
import {InitProject} from './commands/InitProject';
import {Login} from './commands/Login';
import axios from 'axios';
import {Colors} from './utils';
import {DeployProject} from './commands/DeployProject';

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const path = require('path');

export const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        Cookie: 'token=oAKuoPolRK01pMd7qNoM' // TODO: local deployment token
    }
});

axiosInstance.interceptors.response.use(response => response, error => {
    switch (error.response?.status) {
        case 403:
            console.log(`${Colors.FgRed}Please login with ${Colors.FgCyan}upli login${Colors.Reset}`);
            break;
        default:
            const errorMessages = error.response?.data?.error?.message;
            if (errorMessages) {
                errorMessages.forEach((msg: string) => console.log(Colors.FgRed + msg + Colors.Reset));
            } else {
                console.log(`${Colors.FgRed}Unknown error: ${JSON.stringify(error.response)}${Colors.Reset}`);
            }
    }
});

clear();


if (!configExists(GLOBAL_CONFIG_FILE)) {
    // create default config
    console.log('create default config at ' + GLOBAL_CONFIG_FILE);
}


console.log(chalk.red(figlet.textSync('upli-cli', {horizontalLayout: 'full'})));

program
    .option('-d, --debug', 'Enable debug logging');

program.addCommand(Login);
program.addCommand(InitProject);
program.addCommand(DeployProject);

/*program
    .version('0.0.1')
    .name('upli')
    .description('CLI for publishing websites')*/


program.parse(process.argv);

//program.outputHelp();


//const options = program.opts();
