export class CreateTaskDto {
    creatorId: number
    readonly olympicsId: number
    readonly title: string
    readonly solution: string
    readonly image?: string
}