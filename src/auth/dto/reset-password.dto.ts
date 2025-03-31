import { IsNotEmpty, IsUUID, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsUUID()
    resetPasswordToken: string;

    @IsNotEmpty()
    @Length(6, 20)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]*$/, {
        message: 'Password must contain at least one letter and one number'
    })
    password: string;
}