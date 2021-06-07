import commander from 'commander';
import {isProject, loadConfig, PROJECT_CONFIG_FILE} from '../ConfigManager';
import {Colors, debug, isDebug, normalizePath} from '../utils';
import ora from 'ora';
import {axiosInstance} from '../index';
import {ProjectConfigModel} from '../models/ProjectConfigModel';
import {DtoPatchProjectFileResponse} from '../dtos/responses/project/DtoPatchProjectFile.response';
import * as fs from 'fs';

import FormData from 'form-data';
import {ProjectModel} from '../models/ProjectModel';
import chalk from 'chalk';
import {displayLoginError, isLoggedIn} from '../user/UserService';

const shell = require('shelljs');

import md5File = require('md5-file');

export const DeployProject = commander.program.createCommand('deploy')
    .description('Deploy project')
    .action(() => {
        if (!isLoggedIn()) {
            displayLoginError();
            return;
        }

        if (!isProject()) {
            console.log(`${Colors.FgRed}Please initialize project first with ${Colors.FgCyan}upli init${Colors.Reset}`);
            return;
        }


        const spinner = ora('Prepare deployment');


        // hide spinner if debug is enabled
        if (commander.program.opts().debug) {
            debug('Hide spinner for debug logging');
        } else {
            spinner.start();
        }

        const projectConfig = loadConfig(PROJECT_CONFIG_FILE) as ProjectConfigModel;

        const buildPath = getFullBuildPath(projectConfig.project);

        debug(`configBuildPath: ${projectConfig.project.config.deploy.buildPath}`);
        debug(`fullBuildPath: ${buildPath}`);


        const buildCmd = projectConfig.project.config.deploy.buildCmd;
        spinner.text = `Build project with ${buildCmd}`;

        new Promise((resolve, reject) => {
            if (!buildCmd) {
                resolve(null);
                return;
            }
            shell.exec(buildCmd, {silent: !isDebug()}, (code: number, stdout: any, stderr: any) => {
                if (code !== 0) {
                    reject({stdout: stdout, stderr: stderr});
                    return;
                }
                resolve({code, stdout, stderr});
            });
        }).then((res) => {

            spinner.text = 'Fetch server project structure';

            // get file hashes from server

            axiosInstance.get(`/api/project/files/${projectConfig.project.name}`)
                .then(async res => {

                    const serverProjectStructure = res.data as DtoPatchProjectFileResponse[];

                    spinner.text = `Create patch (${serverProjectStructure.length} files found on server)`;

                    const clientProjectStructure = createLocalProjectStructure(projectConfig.project);

                    spinner.text = `Diff server(${serverProjectStructure.length}) <=> client(${clientProjectStructure.length})`;


                    debug(`serverProjectStructure: ${JSON.stringify(serverProjectStructure)}`);
                    debug(`clientProjectStructure: ${JSON.stringify(clientProjectStructure)}`);


                    const removeFiles = serverProjectStructure.filter(serverFile => !clientProjectStructure.find(clientFile => clientFile.name == serverFile.name));

                    const patchFiles = clientProjectStructure.filter(clientFile => !serverProjectStructure.find(serverFile => serverFile.name == clientFile.name && serverFile.hash == clientFile.hash));


                    spinner.text = `Remove ${removeFiles.length} files`;
                    debug(`remove ${removeFiles.length} files`);

                    // delete unused project files
                    const deleteResponse = await axiosInstance.post(`/api/project/delete/${projectConfig.project.name}/files`, {
                        files: removeFiles.map(f => f.name),
                        deleteEmptyFolders: true
                    });
                    debug(`deleteResponse ${JSON.stringify(deleteResponse.data)}`);

                    spinner.text = `Patch ${patchFiles.length} files`;
                    debug(`patch ${patchFiles.length}`);

                    for (let i = 0; i < patchFiles.length; i++) {
                        await patchFilesAsync(projectConfig.project, patchFiles[i].name);
                    }

                    spinner.text = `Patch configuration`;

                    const patchConfigResponse = await axiosInstance.post(`/api/project/config/${projectConfig.project.name}`, projectConfig.project.config);
                    if (patchConfigResponse.status != 200)
                        console.log(`${Colors.FgRed}Error while patching config: ${patchConfigResponse?.data}`);
                    debug(`Configuration patched ${JSON.stringify(projectConfig.project.config)}`);

                    spinner.text = 'Deployed!';
                    spinner.stop();


                    if (deleteResponse?.data?.deletedFiles && deleteResponse.data.deletedFiles.length > 0) {
                        deleteResponse.data.deletedFiles.forEach((deletedFile: string) => console.log(chalk.yellow(`Deleted: ${deletedFile}`)));
                    }

                    if (patchFiles.length == 0) {
                        console.log(`${Colors.FgYellow}No changes were detected and therefore nothing deployed to ${chalk.bold('https://' + projectConfig.project.domain)} !${Colors.Reset}`);
                    } else {
                        patchFiles.forEach(file => console.log(`${Colors.FgMagenta}Patched: ${file.name} ${file.hash}`));
                        console.log(`${Colors.FgGreen}Successfully deployed ${patchFiles.length} files to ${chalk.bold('https://' + projectConfig.project.domain)} !${Colors.Reset}`);
                    }

                }).catch(err => spinner.stop());
        }).catch(err => {
            spinner.stop();
            console.log(chalk.red(`Could not build project: \n${err.stderr}`));
        });

    });

function getFullBuildPath(project: ProjectModel) {
    return normalizePath(process.cwd() + '/' + (project.config.deploy.buildPath ?? '') + '\/');
}

const patchFilesAsync = async (project: ProjectModel, file: string) => {
    try {
        const filepath = getFullBuildPath(project) + file.split('/').join('\\');

        const form_data = new FormData();
        form_data.append('file', fs.createReadStream(filepath));

        debug(`patch ${filepath}`);

        const response = await axiosInstance.post(`/api/project/upload/${project.name}${file}`, form_data, {
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + form_data.getBoundary()
            }
        });

        debug(`patched ${filepath} => ${response?.data}`);

    } catch (err) {
        console.error(err);
    }
};

function createLocalProjectStructure(project: ProjectModel): DtoPatchProjectFileResponse[] {
    const fullBuildPath = getFullBuildPath(project);
    return getFileHashesFromFolder(fullBuildPath, fullBuildPath);
}

function getFileHashesFromFolder(directory: string, projectDirectory: string): DtoPatchProjectFileResponse[] {
    let files: DtoPatchProjectFileResponse[] = [];
    fs.readdirSync(directory).forEach(file => {
        file = directory + '\\' + file;
        if (fs.lstatSync(file).isDirectory()) {
            files = [...files, ...getFileHashesFromFolder(file, projectDirectory)];
        } else {
            files.push({
                name: file.replace(projectDirectory, '').split('\\').join('/').split('//').join('/'),
                hash: md5File.sync(file)
            });
        }
    });
    return files;
}
