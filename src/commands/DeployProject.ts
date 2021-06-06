import commander from 'commander';
import {isProject, loadConfig, PROJECT_CONFIG_FILE} from '../ConfigManager';
import {Colors, debug} from '../utils';
import ora from 'ora';
import {axiosInstance} from '../index';
import {ProjectConfigModel} from '../models/ProjectConfigModel';
import {DtoPatchProjectFileResponse} from '../dtos/responses/project/DtoPatchProjectFile.response';
import * as fs from 'fs';

import FormData from 'form-data';
import md5File = require('md5-file');

export const DeployProject = commander.program.createCommand('deploy')
    .description('Deploy project')
    .action(() => {
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

        spinner.text = 'Fetch server project structure';

        // get file hashes from server

        axiosInstance.get(`/api/project/files/${projectConfig.project.name}`)
            .then(async res => {
                const serverProjectStructure = res.data as DtoPatchProjectFileResponse[];

                spinner.text = `Create patch (${serverProjectStructure.length} files found on server)`;

                const clientProjectStructure = createLocalProjectStructure();

                spinner.text = `Diff server(${serverProjectStructure.length}) <=> client(${clientProjectStructure.length})`;


                debug(`serverProjectStructure: ${JSON.stringify(serverProjectStructure)}`);
                debug(`clientProjectStructure: ${JSON.stringify(clientProjectStructure)}`);


                const removeFiles = serverProjectStructure.filter(serverFile => !clientProjectStructure.find(clientFile => clientFile.name == serverFile.name));

                const patchFiles = clientProjectStructure.filter(clientFile => !serverProjectStructure.find(serverFile => serverFile.name == clientFile.name && serverFile.hash == clientFile.hash));


                spinner.text = `Remove ${removeFiles.length} files`;

                // TODO: implement remove feature

                spinner.text = `Patch ${patchFiles.length} files`;

                for (let i = 0; i < patchFiles.length; i++) {
                    await patchFilesAsync(projectConfig.project.name, patchFiles[i].name);
                }

                spinner.text = `Patch configuration`;

                const patchConfigResponse = await axiosInstance.post(`/api/project/config/${projectConfig.project.name}`, projectConfig.project.serveConfig);
                if (patchConfigResponse.status != 200)
                    console.log(`${Colors.FgRed}Error while patching config: ${patchConfigResponse?.data}`);
                debug(`Configuration patched ${JSON.stringify(projectConfig.project.serveConfig)}`)

                spinner.text = 'Deployed!';
                spinner.stop();

                if (patchFiles.length == 0) {
                    console.log(`${Colors.FgYellow}No changes were detected and therefore nothing deployed!${Colors.Reset}`);
                } else {
                    patchFiles.forEach(file => console.log(`${Colors.FgMagenta}Patched: ${file.name} ${file.hash}`));
                    console.log(`${Colors.FgGreen}Successfully deployed ${patchFiles.length} files to ${projectConfig.project.domain}!${Colors.Reset}`);
                }

            }).catch(err => spinner.stop());


    });

const patchFilesAsync = async (projectName: string, file: string) => {
    try {
        const filepath = process.cwd() + file.split('/').join('\\');

        const form_data = new FormData();
        form_data.append('file', fs.createReadStream(filepath));

        const response = await axiosInstance.post(`/api/project/upload/${projectName}${file}`, form_data, {
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + form_data.getBoundary()
            }
        });

        debug(`patched ${filepath} => ${response?.data}`);

    } catch (err) {
        console.error(err);
    }
};

function createLocalProjectStructure(): DtoPatchProjectFileResponse[] {
    return getFileHashesFromFolder(process.cwd(), process.cwd());
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
