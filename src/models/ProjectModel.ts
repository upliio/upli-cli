export interface ProjectModel {
    name: string,
    domain: string,
    serveConfig: {
        mapping: {
            path: string,
            file: string
        }[]
    }
}
