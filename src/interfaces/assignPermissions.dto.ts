import {IsArray, IsNotEmpty, IsNumber} from "class-validator";

export class AssignPermissionsDto {
    @IsNumber({}, { each: true })
    @IsArray()
    @IsNotEmpty()
    permissionIds: number[];
}