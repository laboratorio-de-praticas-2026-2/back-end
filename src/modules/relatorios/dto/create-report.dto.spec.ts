import { validate } from 'class-validator';
import { CreateReportDto } from './create-report.dto.js';

describe('CreateReportDto', () => {
  it('should accept a valid payload', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject a missing name', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'nome')).toBe(true);
  });

  it('should reject an empty name', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: '',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'nome')).toBe(true);
  });

  it('should reject a missing category', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoria')).toBe(true);
  });

  it('should reject an empty category', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: '',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoria')).toBe(true);
  });

  it('should reject a missing description', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'descricao')).toBe(true);
  });

  it('should reject an invalid start date', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: 'data-invalida',
      data_termino: '2026-09-30',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'data_inicio')).toBe(true);
  });

  it('should reject an invalid end date', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: 'data-invalida',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'data_termino')).toBe(true);
  });

  it('should reject an invalid date interval', async () => {
    const dto = Object.assign(new CreateReportDto(), {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-30',
      data_termino: '2026-09-01',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'data_termino')).toBe(true);
  });

  it('should reject when required fields are missing', async () => {
    const dto = new CreateReportDto();

    const errors = await validate(dto);

    const properties = errors.map((error) => error.property);

    expect(properties).toContain('nome');
    expect(properties).toContain('categoria');
    expect(properties).toContain('descricao');
    expect(properties).toContain('data_inicio');
    expect(properties).toContain('data_termino');
  });
});
