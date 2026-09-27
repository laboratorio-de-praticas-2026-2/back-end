import { PartialType } from '@nestjs/mapped-types';
import { CreateServicoDto } from './criar-servico.dto.js';

export class UpdateServicoDto extends PartialType(CreateServicoDto) {}