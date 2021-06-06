import commander from 'commander';
import {isProject, loadConfig, PROJECT_CONFIG_FILE} from '../ConfigManager';
import {Colors} from '../utils';
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


        const spinner = ora('Prepare deployment').start();

        const projectConfig = loadConfig(PROJECT_CONFIG_FILE) as ProjectConfigModel;

        spinner.text = 'Fetch server project structure';

        // get file hashes from server

        axiosInstance.get(`/api/project/files/${projectConfig.project.name}`)
            .then(async res => {
                const serverProjectStructure = res.data as DtoPatchProjectFileResponse[];

                spinner.text = `Create patch (${serverProjectStructure.length} files found on server)`;

                const clientProjectStructure = createLocalProjectStructure();

                spinner.text = `Diff server(${serverProjectStructure.length}) <=> client(${clientProjectStructure.length})`;


                const removeFiles = serverProjectStructure.filter(serverFile => !clientProjectStructure.find(clientFile => clientFile.name == serverFile.name));

                const patchFiles = clientProjectStructure.filter(clientFile => !serverProjectStructure.find(serverFile => serverFile.name == clientFile.name && serverFile.hash == clientFile.hash));


                spinner.text = `Remove ${removeFiles.length} files`;

                // TODO: implement remove feature

                spinner.text = `Patch ${patchFiles.length} files`;

                for (let i = 0; i < patchFiles.length; i++) {
                    await patchFilesAsync(projectConfig.project.name, patchFiles[i].name);
                }

                spinner.text = 'Deployed!';
                spinner.stop();

                console.log(`${Colors.FgMagenta}Patched ${patchFiles.length} files!`);
                console.log(`${Colors.FgGreen}Successfully deployed to ${projectConfig.project.domain}!${Colors.Reset}`);


            }).catch(err => spinner.stop());


    });

const patchFilesAsync = async (projectName: string, file: string) => {
    try {
        console.log(`/api/project/upload/${projectName}/${file}`);

        const form_data = new FormData();
        form_data.append('file', fs.createReadStream(file));

        const response = await axiosInstance.post(`/api/project/upload/${projectName}/${file}`, form_data, {
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + form_data.getBoundary()
            }
        });
        //console.log('file patched ' + response.data, file);
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
        if (fs.lstatSync(file).isDirectory()) {
            files = [...files, ...getFileHashesFromFolder(file, projectDirectory)];
        } else {
            files.push({
                name: file.replace(projectDirectory, ''),
                hash: md5File.sync(file)
            });
        }
    });
    return files;
}
