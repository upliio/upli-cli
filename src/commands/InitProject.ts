import commander from 'commander';
import {getCurrentFolderName, isProject, PROJECT_CONFIG_FILE, writeConfig} from '../ConfigManager';
import {Colors, detectFramework, packageVersion} from '../utils';
import ora from 'ora';
import {axiosInstance} from '../index';
import {ProjectConfigModel} from '../models/ProjectConfigModel';
import {ProjectModel} from '../models/ProjectModel';

const prompts = require('prompts');

export const InitProject = commander.program.createCommand('init')
    .description('Initialize project in current path')
    .action(() => {
        if (isProject()) {
            console.log(`${Colors.FgRed} This project has already been initialized${Colors.Reset}`);
        } else {
            (async () => {
                const promptResponse = await prompts([
                        {
                            type: 'text',
                            name: 'name',
                            message: `Project Name?`,
                            initial: getCurrentFolderName(),
                            validate: (name: string) => {
                                if (name == 'exist') // TODO: check if project already exist
                                    return `This project name already exist in your user account. You can delete it with ${Colors.FgCyan}upli project rm ${name}`;
                                return true;
                            }
                        },
                        {
                            type: 'select',
                            name: 'framework',
                            message: 'Select a framework',
                            choices: [
                                {title: 'No Framework', description: 'No framework used', value: 'plain'},
                                {title: 'Angular', value: 'angular'},
                                {title: 'React', value: 'react'}
                            ],
                            initial: detectFramework().valueOf()
                        },
                        {
                            type: 'toggle',
                            name: 'confirmation',
                            message: 'Should the project be created now?',
                            initial: true,
                            active: 'yes',
                            inactive: 'no'
                        }
                    ]
                );

                if (promptResponse.confirmation) {
                    const spinner = ora('Create project').start();

                    const project = {
                        name: promptResponse.name,
                        serveConfig: {
                            mapping: [
                                {
                                    'path': '/',
                                    'file': '/index.html'
                                }
                            ]
                        }
                    } as ProjectModel;


                    axiosInstance.post('/api/project/create', project).then(res => {
                        spinner.stop();
                        console.log(`${Colors.FgGreen}Project created at ${Colors.FgCyan}https://${res.data.domain}${Colors.FgGreen}!${Colors.Reset}`);
                        project.domain = res.data.domain;
                        writeConfig(PROJECT_CONFIG_FILE, {
                            project: project,
                            version: packageVersion
                        } as ProjectConfigModel);
                    }).catch(() => spinner.stop());
                }
            })();


        }
    });
