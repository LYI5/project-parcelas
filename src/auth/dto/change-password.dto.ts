import { IsNotEmpty, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
    @IsNotEmpty()
    oldPassword: string;

    @IsNotEmpty()
    @Length(6, 20)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]*$/, {
        message: 'Password must contain at least one letter and one number'
    })
    newPassword: string;
}