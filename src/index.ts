#!/usr/bin/env node


import {configExists, GLOBAL_CONFIG_FILE} from './ConfigManager';
import {program} from 'commander';
import {InitProject} from './commands/InitProject';
import {Login} from './commands/Login';
import axios from 'axios';
import {Colors} from './utils';
import {DeployProject} from './commands/DeployProject';
import {getToken, setToken} from './user/UserService';

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

axiosInstance.interceptors.request.use(request => {
    request.headers.Cookie = `token=${getToken()}`
    return request;
}, error => error);

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
    .option('-d, --debug', 'Enable debug logging')
    .option('-a, --api <api>', 'Use custom api endpoint (for development)', a => axiosInstance.defaults.baseURL = a)
    .option('-t, --token <token>', 'Use authentication token', a => setToken(a))
    .addCommand(Login)
    .addCommand(InitProject)
    .addCommand(DeployProject)
    .parse(process.argv);
