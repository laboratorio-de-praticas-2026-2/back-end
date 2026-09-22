    import { Injectable } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';
    import { v2 as cloudinary } from 'cloudinary';

    @Injectable()
    export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
        cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        });
    }
    }
    async uploadPdf(buffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
            resource_type: 'raw',
            format: 'pdf',
            },
            (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            if (!result?.secure_url) {
                reject(new Error('URL segura não retornada pelo Cloudinary'));
                return;
            }

            resolve(result.secure_url);
            },
        );

        uploadStream.end(buffer);
        });
    }
    async deletePdf(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: 'raw',
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });
}
    }