import {UserModel} from '../models/UserModel';
import {axiosInstance, GLOBAL_CONFIG} from '../index';
import {appendConfig, GLOBAL_CONFIG_FILE} from '../ConfigManager';
import {GlobalConfigModel} from '../models/GlobalConfigModel';
import chalk from 'chalk';

const ora = require('ora');


export let user: UserModel;

export let token: string;

export const setToken = (newToken: string) => token = newToken;

export const getToken = () => {
    if (token)
        return token;
    if (GLOBAL_CONFIG?.token)
        return GLOBAL_CONFIG.token;
};

export const isLoggedIn = () => user != null;

export const displayLoginError = () => {
    console.log(chalk.red(`Please login first with ${chalk.bold('upli login')}`));
};

export const setCurrentUser = (setUser: UserModel) => user = setUser;

export const getCurrentUser = async () => {
    try {
        if (user != null)
            return user;
        const res = await axiosInstance.get(`/api/user/self`);
        user = res.data;
        appendConfig(GLOBAL_CONFIG_FILE, {
            user: user,
            token: getToken()
        } as GlobalConfigModel);
        return user;
    } catch (ex) {
        return Promise.reject(ex);
    }
};
