import { StorageAdapter } from '../../adapters/storage';

export interface ImgurConfig {
  clientId?: string;
}

export class ImgurStorageAdapter implements StorageAdapter {
  private clientId: string;

  constructor(config?: ImgurConfig) {
    this.clientId = config?.clientId || process.env.IMGUR_CLIENT_ID || '';
  }

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (!this.clientId) {
      throw new Error('Imgur Client ID is missing. Please configure it in Media Settings.');
    }

    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${this.clientId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: fileBuffer.toString('base64'),
        type: 'base64',
        name: filename,
        title: filename
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`Imgur upload failed: ${data.data?.error || res.statusText}`);
    }

    return data.data.link;
  }

  async delete(urlOrFilename: string): Promise<void> {
    // Imgur anonymous uploads require a deletehash to delete, which is only returned during the upload response.
    // Since the CMS only stores the final image URL, we cannot easily delete anonymous Imgur uploads.
    console.warn(`[Imgur Plugin] Cannot automatically delete image from Imgur: ${urlOrFilename}. Anonymous uploads lack a stored deletehash.`);
  }
}
