import { Controller, Get, Query } from '@nestjs/common';
import { CurrentRole } from '../../commons/decorators/current-role.decorator.js';
import type { UserRole } from '../../commons/decorators/current-role.decorator.js';
import { AdvancedSearchQueryDto } from './dto/advanced-search-query.dto.js';
import { DocumentQueryDto } from './dto/document-query.dto.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('document')
  searchByDocument(@Query() query: DocumentQueryDto, @CurrentRole() role: UserRole) {
    return this.searchService.searchByDocument(query.doc, role);
  }

  @Get('advanced')
  advancedSearch(@Query() query: AdvancedSearchQueryDto, @CurrentRole() role: UserRole) {
    return this.searchService.advancedSearch(query, role);
  }
}
