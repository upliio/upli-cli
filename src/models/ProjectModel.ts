import {ProjectModelConfigDto} from '../dtos/ProjectModelConfigDto';

export interface ProjectModel {
    name: string,
    domain: string,
    config: ProjectModelConfigDto
}
