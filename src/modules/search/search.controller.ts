import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../commons/decorators/current-role.decorator.js';
import type { AuthenticatedUser } from '../../commons/decorators/current-role.decorator.js';
import { AdvancedSearchQueryDto } from './dto/advanced-search-query.dto.js';
import { DocumentQueryDto } from './dto/document-query.dto.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('document')
  searchByDocument(@Query() query: DocumentQueryDto, @CurrentUser() user: AuthenticatedUser | null) {
    return this.searchService.searchByDocument(query.doc, user);
  }

  @Get('advanced')
  advancedSearch(@Query() query: AdvancedSearchQueryDto, @CurrentUser() user: AuthenticatedUser | null) {
    return this.searchService.advancedSearch(query, user);
  }
}
