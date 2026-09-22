import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('streamifier', () => ({
  createReadStream: vi.fn(() => ({
    pipe: vi.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service.js';
import { InternalServerErrorException } from '@nestjs/common';
import { Readable } from 'stream';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockFile: Express.Multer.File = {
    fieldname: 'imagem',
    originalname: 'imagem.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake image'),
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
  };

  const mockCloudinary = {
    uploader: {
      upload_stream: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: 'CLOUDINARY',
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('deve fazer upload da imagem com sucesso', async () => {
    const mockResponse = {
      secure_url: 'http://cloudinary.com/test.png',
    };

    mockCloudinary.uploader.upload_stream.mockImplementation(
      (
        _options: unknown,
        callback: (
          error: Error | null,
          result?: { secure_url: string },
        ) => void,
      ) => {
        callback(null, mockResponse);
        return { end: vi.fn() };
      },
    );

    const result = await service.uploadFile(mockFile);

    expect(result).toEqual(mockResponse);
    expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
  });

  it('deve lançar erro quando o cloudinary falhar', async () => {
    mockCloudinary.uploader.upload_stream.mockImplementation(
      (
        _options: unknown,
        callback: (
          error: Error | null,
          result?: { secure_url: string },
        ) => void,
      ) => {
        callback(new Error('upload error'));
        return { end: vi.fn() };
      },
    );

    await expect(service.uploadFile(mockFile)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});