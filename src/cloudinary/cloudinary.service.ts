import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'nest-uploads' }, (error, result) => {
          if (error) return reject(new Error(error.message));
          if (!result)
            return reject(new Error('No result returned from Cloudinary'));
          resolve(result);
        })
        .end(file.buffer);
    });
  }
}
