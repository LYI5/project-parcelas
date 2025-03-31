import { IsNotEmpty, IsUUID } from 'class-validator';

export class ActivateUserDto {
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @IsNotEmpty()
    @IsUUID()
    code: string;
}