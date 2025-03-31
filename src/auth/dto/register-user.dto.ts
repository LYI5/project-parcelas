import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(2, 50)
    @Matches(/^[a-zA-Z0-9\s]*$/, {
        message: 'Name can only contain letters, numbers and spaces'
    })
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(6, 20)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]*$/, {
        message: 'Password must contain at least one letter and one number'
    })
    password: string;
}