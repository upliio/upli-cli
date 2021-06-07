import {UserModel} from './UserModel';

export interface GlobalConfigModel {
    user: UserModel,
    token: string
}
