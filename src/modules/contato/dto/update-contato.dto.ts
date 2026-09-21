import { PartialType } from '@nestjs/mapped-types';
import { CreateContatoDto } from './create-contato.dto.js';

export class UpdateContatoDto extends PartialType(CreateContatoDto) {}
