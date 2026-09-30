import {IsOptional,IsString} from 'class-validator';
export class DocumentQueryDto {
  @IsOptional() @IsString() doc?: string;
}
