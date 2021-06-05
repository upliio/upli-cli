import {Colors} from '../utils';

const ora = require('ora');
import {UserModel} from '../models/UserModel';





export let user: UserModel;


export const login = () => {
    const spinner = ora(`Wait for successful login. ${Colors.FgYellow}Cancel: ${Colors.Underscore}STRG + C${Colors.Reset}`).start();


    function loginSuccess(){
        clearInterval(checkLoginInterval);
        spinner.stop();
        console.log('done');
    }


    const checkLoginInterval = setInterval(() => {

    }, 2000);

    setTimeout(() => {
        loginSuccess();
    }, 5000);
}

