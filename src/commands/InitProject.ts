import commander from 'commander';
import {getCurrentFolderName, isProject} from '../ConfigManager';
import {Colors, detectFramework} from '../utils';

const prompts = require('prompts');

export const InitProject = commander.program.createCommand('init')
    .description('Initialize project in current path')
    .action(() => {
        if (isProject()) {
            console.log(`${Colors.FgRed} This project has already been initialized`);
        } else {
            (async () => {
                const response = await prompts([
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
                        }
                    ]
                );

                console.log(response);
            })();


        }
    });
