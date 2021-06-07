import * as fs from 'fs';
import {program} from 'commander';
import {ProjectModelConfigDto} from './dtos/ProjectModelConfigDto';

const packageJson = require('../package.json');

export const packageVersion = packageJson.version;

export function detectFramework(): Framework {
    const files = fs.readdirSync(process.cwd());

    if (files.includes('angular.json'))
        return <Framework>Frameworks.find(f => f.defaultConfig.framework == 'angular');
    // TODO: add react detection

    return <Framework>Frameworks.find(f => f.defaultConfig.framework == 'none');
}

export interface Framework {
    title: string
    defaultConfig: ProjectModelConfigDto
}

export const Frameworks: Framework[] = [
    {
        title: 'No framework',
        defaultConfig: {
            framework: 'none',
            mapping: [
                {
                    path: '/',
                    file: 'index.html'
                }
            ],
            deploy: {
                ignored: [],
                buildPath: null,
                buildCmd: null
            }
        }
    },
    {
        title: 'Angular',
        defaultConfig: {
            framework: 'angular',
            mapping: [
                {
                    path: '404',
                    file: 'index.html'
                }
            ],
            deploy: {
                ignored: [],
                buildPath: 'dist/build',
                buildCmd: 'ng build --output-path dist/build'
            }
        }
    },
    {
        title: 'React',
        defaultConfig: {} as ProjectModelConfigDto
        // TODO: add default config for react
    }
];

/*
export enum Framework {
    NONE,
    ANGULAR,
    REACT
}*/

export function delay(time: number) {
    return new Promise(resolve => setTimeout(() => resolve(null), time));
}

export function debug(msg: string) {
    if (program.opts().debug) {
        console.log(`${Colors.BgBlue}${Colors.FgWhite}[DEBUG]${Colors.BgBlack}${Colors.FgCyan} ${msg}${Colors.Reset}`);
    }
}

export const isDebug = (): boolean => program.opts().debug;

export const normalizePath = (file: string) => file.split('\\').join('/').split('//').join('/');

export enum Colors {
    Reset = '\x1b[0m',
    Bright = '\x1b[1m',
    Dim = '\x1b[2m',
    Underscore = '\x1b[4m',
    Blink = '\x1b[5m',
    Reverse = '\x1b[7m',
    Hidden = '\x1b[8m',

    FgBlack = '\x1b[30m',
    FgRed = '\x1b[31m',
    FgGreen = '\x1b[32m',
    FgYellow = '\x1b[33m',
    FgBlue = '\x1b[34m',
    FgMagenta = '\x1b[35m',
    FgCyan = '\x1b[36m',
    FgWhite = '\x1b[37m',

    BgBlack = '\x1b[40m',
    BgRed = '\x1b[41m',
    BgGreen = '\x1b[42m',
    BgYellow = '\x1b[43m',
    BgBlue = '\x1b[44m',
    BgMagenta = '\x1b[45m',
    BgCyan = '\x1b[46m',
    BgWhite = '\x1b[47m'
}
