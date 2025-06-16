import {IsArray, IsNotEmpty, IsNumber} from "class-validator";

export class AssignRoleDto {
    @IsNumber({}, { each: true })
    @IsArray()
    @IsNotEmpty()
    roleIds: number[];
}