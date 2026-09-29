import { IsEnum } from 'class-validator';
import { StatusConversa } from '../enums/status-conversa.enum.js';

export class UpdateStatusConversaDto {
  @IsEnum(StatusConversa)
  status: StatusConversa;
}
