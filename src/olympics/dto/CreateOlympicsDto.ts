export class CreateOlympicsDto{
    id: number
    creatorId?: number
    readonly name: string
    readonly description?: string
    readonly startTime: Date
    readonly endTime: Date
    readonly databaseScript: string
    readonly image?: string
}