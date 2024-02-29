export class UpdateTaskDto{
    id: number
    creatorId: number
    readonly title: string
    readonly solution: string
    readonly image?: string
}