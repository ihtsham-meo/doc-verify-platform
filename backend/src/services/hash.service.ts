import crypto from 'crypto';
import fs from 'fs';

export const HashService = {

  // Hash a file from disk by streaming — memory efficient for large files
  async hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  },

  // Hash a raw buffer directly (for verification use)
  hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  },

  // Compare two hashes securely — timing-safe to prevent timing attacks
  compareHashes(hashA: string, hashB: string): boolean {
    if (hashA.length !== hashB.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(hashA, 'hex'),
      Buffer.from(hashB, 'hex')
    );
  },

};