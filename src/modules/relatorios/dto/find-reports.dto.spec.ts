import 'reflect-metadata';
import { validate } from 'class-validator';
import { FindReportsDto } from './find-reports.dto.js';


describe('FindReportsDto', () => {
  it('should accept a valid payload', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      nome: 'Financeiro',
      categoria: 'Financeiro',
      status: 'PENDENTE',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 1,
      limit: 10,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should accept an empty payload', async () => {
    const dto = new FindReportsDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid status', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      status: 'INVALIDO',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('should reject an invalid start date', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      data_inicio: 'data-invalida',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'data_inicio')).toBe(true);
  });

  it('should reject an invalid end date', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      data_termino: 'data-invalida',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'data_termino')).toBe(true);
  });

  it('should reject a page smaller than 1', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      page: 0,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('should reject a limit smaller than 1', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      limit: 0,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('should reject a limit greater than 100', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      limit: 101,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('should accept the maximum limit', async () => {
    const dto = Object.assign(new FindReportsDto(), {
      limit: 100,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should accept all valid statuses', async () => {
    const statuses = ['PENDENTE', 'GERADO', 'FALHA'];

    for (const status of statuses) {
      const dto = Object.assign(new FindReportsDto(), {
        status,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });
});
