import { Injectable } from '@nestjs/common';

@Injectable()import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, col, fn } from 'sequelize';
import { DocumentoSolicitacao } from '../../models/documento-solicitacao.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { StatusValidacaoDocumentoEnum } from '../../commons/enums/status-validacao-documento.enum.js';
import { PeriodoFiltro, resolvePeriodo } from '../../commons/utils/periodo-filtro.util.js';

export class DocumentosService {
    constructor(
        @InjectModel(DocumentoSolicitacao)
        private readonly documentoModel: typeof DocumentoSolicitacao,
        @InjectModel(Solicitacao)
        private readonly solicitacaoModel: typeof Solicitacao,
    ) {}

    async getIndicadores(startDate?: string, endDate?: string) {
        const periodo = resolvePeriodo(startDate, endDate);

        
    }
}
