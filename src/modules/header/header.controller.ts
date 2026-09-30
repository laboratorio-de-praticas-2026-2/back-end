import { Controller, Get } from '@nestjs/common';
import { HeaderService } from './header.service.js';
import type { HeaderResponseDto } from './dto/header-response.dto.js';

@Controller('header')
export class HeaderController {
	constructor(private readonly headerService: HeaderService) {}

	@Get()
	getHeader(): HeaderResponseDto {
		return this.headerService.getHeader();
	}
}