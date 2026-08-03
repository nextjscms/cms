import { v2 as cloudinary } from 'cloudinary';
import { StorageAdapter } from '../../adapters/storage';
import path from 'path';

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

export class CloudinaryStorageAdapter implements StorageAdapter {
  private folder: string;

  constructor(config?: CloudinaryConfig) {
    const cloud_name = config?.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = config?.apiKey || process.env.CLOUDINARY_API_KEY;
    const api_secret = config?.apiSecret || process.env.CLOUDINARY_API_SECRET;
    
    this.folder = config?.folder || 'nextjscms';

    if (cloud_name && api_key && api_secret) {
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true
      });
    }
  }

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (!cloudinary.config().cloud_name) {
      throw new Error('Cloudinary credentials are missing. Please configure them in Media Settings.');
    }

    return new Promise((resolve, reject) => {
      // Use upload_stream to push buffer to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: path.parse(filename).name,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Cloudinary upload failed: Unknown error'));
          }
        }
      );

      // End the stream with the buffer
      uploadStream.end(fileBuffer);
    });
  }

  async delete(urlOrFilename: string): Promise<void> {
    if (!cloudinary.config().cloud_name) {
      throw new Error('Cloudinary credentials are missing. Please configure them in Media Settings.');
    }

    // Attempt to extract the public_id from a Cloudinary URL or assume it's the public_id
    // Typically it's the folder/public_id
    try {
      let publicId = urlOrFilename;
      if (urlOrFilename.includes('cloudinary.com')) {
        // Simple extraction: get the path after /upload/ (and optional transformations)
        const parts = urlOrFilename.split('/');
        const uploadIndex = parts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1) {
          // It could be /upload/v1234/folder/file.ext
          // Find the version part
          const maybeVersionIndex = uploadIndex + 1;
          const startIndex = parts[maybeVersionIndex].startsWith('v') ? maybeVersionIndex + 1 : maybeVersionIndex;
          const pathWithExt = parts.slice(startIndex).join('/');
          // Remove extension
          publicId = pathWithExt.substring(0, pathWithExt.lastIndexOf('.'));
        }
      } else {
         // If it's just the filename, we saved it in the configured folder
         const name = path.parse(urlOrFilename).name;
         publicId = `${this.folder}/${name}`;
      }

      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error('Error deleting from Cloudinary:', e);
    }
  }
}
