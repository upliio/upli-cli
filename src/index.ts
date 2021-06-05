#!/usr/bin/env node


import {configExists, GLOBAL_CONFIG_FILE} from './ConfigManager';
import {program} from 'commander';
import {InitProject} from './commands/InitProject';
import {Login} from './commands/Login';

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const path = require('path');

clear();


if (!configExists(GLOBAL_CONFIG_FILE)) {
    // create default config
    console.log('create default config at ' + GLOBAL_CONFIG_FILE);
}


console.log(chalk.red(figlet.textSync('upli-cli', {horizontalLayout: 'full'})));


program.addCommand(InitProject)
program.addCommand(Login)

program
    .command('deploy')
    .description('Deploy project to upli servers')
    .action(() => {

    });


/*program
    .version('0.0.1')
    .name('upli')
    .description('CLI for publishing websites')*/


program.parse(process.argv);

//program.outputHelp();


//const options = program.opts();
