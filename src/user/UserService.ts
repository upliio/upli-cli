import {Colors} from '../utils';
import {UserModel} from '../models/UserModel';

const ora = require('ora');


export let user: UserModel;

export let argToken: string;

export const setToken = (token: string) => argToken = token;

export const getToken = () => {
    if (argToken)
        return argToken;
};

export const login = () => {
    const spinner = ora(`Wait for successful login. ${Colors.FgYellow}Cancel: ${Colors.Underscore}STRG + C${Colors.Reset}`).start();


    function loginSuccess() {
        clearInterval(checkLoginInterval);
        spinner.stop();
        console.log('done');
    }


    const checkLoginInterval = setInterval(() => {

    }, 2000);

    setTimeout(() => {
        loginSuccess();
    }, 5000);
};

