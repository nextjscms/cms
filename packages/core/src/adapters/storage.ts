// Abstract Storage Adapter Interface
export interface StorageAdapter {
  /**
   * Upload a file to the storage provider.
   * @param file The file object (Buffer or Stream)
   * @param filename The desired filename
   * @param mimeType The file's mime type
   * @returns The public URL of the uploaded file
   */
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * Delete a file from the storage provider.
   * @param url The public URL or key of the file to delete
   */
  delete(url: string): Promise<void>;
}
