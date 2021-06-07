import {ProjectModel} from './ProjectModel';

export interface UserModel {
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    projects: ProjectModel
}
