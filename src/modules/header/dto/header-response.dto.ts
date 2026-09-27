export class HeaderLogoDto {
  src!: string;
  alt!: string;
  href!: string;
}

export class HeaderMenuItemDto {
  id!: string;
  label!: string;
  href!: string;
}

export class HeaderButtonDto {
  id!: string;
  label!: string;
  href!: string;
  variant?: string;
}

export class HeaderResponseDto {
  logo!: HeaderLogoDto;
  menu!: HeaderMenuItemDto[];
  buttons!: HeaderButtonDto[];
}