export interface ProjectModelConfigDto {
    framework: string
    mapping: {
        path: string,
        file: string
    }[],
    deploy: {
        buildCmd: string | null
        buildPath: string | null
        ignored: string[]
    }
}
