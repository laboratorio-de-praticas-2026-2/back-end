import { Injectable } from '@nestjs/common';
import type { HeaderResponseDto } from './dto/header-response.dto.js';

@Injectable()
export class HeaderService {
	getHeader(): HeaderResponseDto {
		const menu = [
			{ id: 'home', label: 'Início', href: '/' },
			{ id: 'sobre-nos', label: 'Sobre nós', href: '/sobre-nos' },
			{ id: 'servicos', label: 'Serviços', href: '/servicos' },
			{ id: 'solucoes', label: 'Soluções', href: '/solucoes' },
			{ id: 'blog', label: 'Blog', href: '/blog' },
			{ id: 'duvidas', label: 'Dúvidas', href: '/duvidas' },
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