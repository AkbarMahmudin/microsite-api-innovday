import { Injectable } from '@nestjs/common';
import { StorageService } from '@nhogs/nestjs-firebase';
import { extname } from 'path';

@Injectable()
export class MediaService {
  constructor(private storageService: StorageService) {}

  async getFileDownloadUrl(filename: string) {
    if (!filename) {
      return null;
    }

    const url = await this.storageService.getDownloadURL(filename);
    return url;
  }

  async getFileStream(filename: string) {
    const stream = await this.storageService.getStream(filename);
    return stream;
  }

  async uploadFile(file: Express.Multer.File) {
    const filename = Date.now() + extname(file.originalname);
    const url = await this.storageService.uploadString(
      filename,
      file.buffer.toString('base64'),
      'base64',
      {
        contentType: file.mimetype,
      },
    );

    return url;
  }

  async deleteFile(filename: string) {
    const url = await this.storageService.deleteObject(filename);
    return url;
  }
}
