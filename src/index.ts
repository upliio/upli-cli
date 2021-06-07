#!/usr/bin/env node


import {program} from 'commander';
import {InitProject} from './commands/InitProject';
import {Login} from './commands/Login';
import axios from 'axios';
import {Colors, debug} from './utils';
import {DeployProject} from './commands/DeployProject';
import {getToken, setCurrentUser, setToken, user} from './user/UserService';
import {GLOBAL_CONFIG_FILE, loadConfig} from './ConfigManager';
import {GlobalConfigModel} from './models/GlobalConfigModel';
import {Logout} from './commands/Logout';

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const path = require('path');

export const axiosInstance = axios.create({
    baseURL: 'https://api.upli.io',
    headers: {
        Cookie: 'token=oAKuoPolRK01pMd7qNoM' // TODO: local deployment token
    }
});

axiosInstance.interceptors.request.use(request => {
    request.headers.Cookie = `token=${getToken()}`;
    return request;
}, error => error);

axiosInstance.interceptors.response.use(response => response, error => {
    switch (error.response?.status) {
        case 401:
            console.log(`${Colors.FgRed}Please login with ${Colors.FgCyan}upli login${Colors.Reset}`);
            break;
        case 403: // dont handle this error here
            break;
        default:
            const errorMessages = error.response?.data?.error?.message;
            debug(`Error while sending request to ${error?.config?.url}`);
            if (errorMessages) {
                errorMessages.forEach((msg: string) => console.log(Colors.FgRed + msg + Colors.Reset));
            } else {
                console.log(`${Colors.FgRed}Unknown error: ${JSON.stringify(error.response)}${Colors.Reset}`);
            }
    }
    return Promise.reject(error);
});

clear();

console.log(chalk.red(figlet.textSync('upli-cli', {horizontalLayout: 'full'})) + chalk.grey('https://upli.io'));


// load global config
export const GLOBAL_CONFIG = loadConfig(GLOBAL_CONFIG_FILE) as GlobalConfigModel;

if (GLOBAL_CONFIG?.user) {
    setCurrentUser(GLOBAL_CONFIG?.user);
    console.log(chalk.yellow(`Currently logged in as ${user.username}\n`));
}


program
    .option('-d, --debug', 'Enable debug logging')
    .option('-a, --api <api>', 'Use custom api endpoint (for development)', a => axiosInstance.defaults.baseURL = a)
    .option('-t, --token <token>', 'Use authentication token', a => setToken(a))
    .addCommand(Login)
    .addCommand(Logout)
    .addCommand(InitProject)
    .addCommand(DeployProject)
    .parse(process.argv);
