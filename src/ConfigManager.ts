import * as fs from 'fs';
import * as os from 'os';

export const PROJECT_CONFIG_FILE = 'upli.json';
export const GLOBAL_CONFIG_FILE = `${os.homedir()}\\upli-global.json`;

export const isProject = () => configExists(`${process.cwd()}\\${PROJECT_CONFIG_FILE}`);

export const configExists = (file: string) => fs.existsSync(file);

export const loadConfig = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'));

export const writeConfig = (file: string, content: any) => fs.writeFileSync(file, JSON.stringify(content));

export const getCurrentFolderName = () => {
    const currentFolder = process.cwd().split('\\');
    return currentFolder[currentFolder.length - 1];
};
