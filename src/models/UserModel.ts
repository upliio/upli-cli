import {ProjectModel} from './ProjectModel';

export interface UserModel {
    firstName: string,
    lastName: string,
    email: string,
    projects: ProjectModel,
    token: string
}
