import { describe, expect, it, vi } from 'vitest';

const {
  uploadStream,
  uploadStreamMock,
  destroyMock,
  configMock,
} = vi.hoisted(() => {
  const uploadStream = {
    end: vi.fn(),
  };

  const uploadStreamMock = vi.fn((_options, callback) => {
    callback(null, {
      secure_url:
        'https://res.cloudinary.com/test/raw/upload/relatorio.pdf',
    });

    return uploadStream;
  });

  const destroyMock = vi.fn((_publicId, _options, callback) => {
    callback(null, {
      result: 'ok',
    });
  });

  const configMock = vi.fn();

  return {
    uploadStream,
    uploadStreamMock,
    destroyMock,
    configMock,
  };
});

vi.mock('cloudinary', () => ({
  v2: {
    config: configMock,
    uploader: {
      upload_stream: uploadStreamMock,
      destroy: destroyMock,
    },
  },
}));

import { CloudinaryService } from './cloudinary.service.js';

describe('CloudinaryService', () => {
  it('deve fazer upload do PDF e retornar a secure_url', async () => {
    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    const buffer = Buffer.from('PDF de teste');

    const result = await service.uploadPdf(buffer);

    expect(result).toBe(
      'https://res.cloudinary.com/test/raw/upload/relatorio.pdf',
    );

    expect(configMock).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });

    expect(uploadStreamMock).toHaveBeenCalledWith(
      {
        resource_type: 'raw',
        format: 'pdf',
      },
      expect.any(Function),
    );

    expect(uploadStream.end).toHaveBeenCalledWith(buffer);
  });

  it('deve retornar erro quando o upload falhar', async () => {
    uploadStreamMock.mockImplementationOnce(
      (_options, callback) => {
        callback(new Error('Falha no upload'), undefined);

        return uploadStream;
      },
    );

    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    const buffer = Buffer.from('PDF de teste');

    await expect(
      service.uploadPdf(buffer),
    ).rejects.toThrow('Falha no upload');
  });

  it('deve excluir o PDF do Cloudinary', async () => {
    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    await service.deletePdf('relatorios/relatorio-1');

    expect(destroyMock).toHaveBeenCalledWith(
      'relatorios/relatorio-1',
      {
        resource_type: 'raw',
      },
      expect.any(Function),
    );
  });

  it('deve retornar erro quando a exclusão do PDF falhar', async () => {
    destroyMock.mockImplementationOnce(
      (_publicId, _options, callback) => {
        callback(
          new Error('Falha ao excluir PDF'),
          undefined,
        );
      },
    );

    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    await expect(
      service.deletePdf('relatorios/relatorio-1'),
    ).rejects.toThrow('Falha ao excluir PDF');
  });

  it('deve baixar o PDF do Cloudinary e retornar um Buffer', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 PDF de teste');

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
          },
        }),
      );

    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    const result = await service.downloadPdf(
      'https://res.cloudinary.com/test/raw/upload/relatorio.pdf',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://res.cloudinary.com/test/raw/upload/relatorio.pdf',
    );

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(pdfBuffer);

    fetchMock.mockRestore();
  });

  it('deve retornar erro quando o download do PDF falhar', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(null, {
          status: 404,
          statusText: 'Not Found',
        }),
      );

    const configServiceMock = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    };

    const service = new CloudinaryService(
      configServiceMock as any,
    );

    await expect(
      service.downloadPdf(
        'https://res.cloudinary.com/test/raw/upload/relatorio.pdf',
      ),
    ).rejects.toThrow(
      'Falha ao obter PDF do Cloudinary: 404',
    );

    fetchMock.mockRestore();
  });
});