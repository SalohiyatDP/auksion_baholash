import { promises as fs } from "fs";
import path from "path";

/**
 * Fayl saqlash abstraktsiyasi. Hozircha lokal disk; kelajakda S3 ga
 * o'tish uchun StorageProvider interfeysini implement qilish kifoya.
 */
export interface StorageProvider {
  save(relativePath: string, data: Buffer): Promise<string>;
  read(relativePath: string): Promise<Buffer>;
  delete(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
}

class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  private full(relativePath: string) {
    // yo'l traversaldan himoya
    const safe = path
      .normalize(relativePath)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    return path.join(this.root, safe);
  }

  async save(relativePath: string, data: Buffer): Promise<string> {
    const full = this.full(relativePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return relativePath;
  }

  async read(relativePath: string): Promise<Buffer> {
    return fs.readFile(this.full(relativePath));
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(this.full(relativePath));
    } catch {
      /* mavjud bo'lmasa e'tiborsiz */
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.full(relativePath));
      return true;
    } catch {
      return false;
    }
  }
}

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

export const storage: StorageProvider = new LocalStorageProvider(STORAGE_DIR);
export { STORAGE_DIR };
