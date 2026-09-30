import { Injectable } from '@nestjs/common';
import type { HeaderResponseDto } from './dto/header-response.dto.js';

@Injectable()
export class HeaderService {
	getHeader(): HeaderResponseDto {
		const menu = [
			{ id: 'home', label: 'Início', href: '/' },
			{ id: 'servicos', label: 'Serviços', href: '/servicos' },
			{ id: 'busca', label: 'Busca', href: '/busca' },
			{ id: 'duvidas', label: 'Dúvidas', href: '/faq' },
		];
		const buttons = [
			{ id: 'login', label: 'Login', href: '/login', variant: 'primary' },
		];
		const hasValidHref = (item: { href?: string | null }) =>
			typeof item.href === 'string' && item.href.trim().length > 0;

		return {
			logo: {
				src: '/logo.svg',
				alt: 'Portal Contábil Grupo Bortone',
				href: '/',
			},
			menu: menu.filter(hasValidHref),
			buttons: buttons.filter(hasValidHref),
		};
	}
}
