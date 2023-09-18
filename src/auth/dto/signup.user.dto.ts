export class SignupUserDto{
    readonly email: string
    readonly password: string
    readonly surname: string
    readonly name: string
    readonly course: number
    readonly group: number
    readonly phone?: string
}