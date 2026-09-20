import { describe, expect, it, vi } from 'vitest';

const { uploadStream, uploadStreamMock, configMock } = vi.hoisted(() => {
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

  const configMock = vi.fn();

  return {
    uploadStream,
    uploadStreamMock,
    configMock,
  };
});

vi.mock('cloudinary', () => ({
  v2: {
    config: configMock,
    uploader: {
      upload_stream: uploadStreamMock,
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

    const service = new CloudinaryService(configServiceMock as any);

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
});
  it('deve retornar erro quando o upload falhar', async () => {
    uploadStreamMock.mockImplementationOnce((_options, callback) => {
      callback(new Error('Falha no upload'), undefined);

      return uploadStream;
    });

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

    const service = new CloudinaryService(configServiceMock as any);

    const buffer = Buffer.from('PDF de teste');

    await expect(service.uploadPdf(buffer)).rejects.toThrow('Falha no upload');
  });