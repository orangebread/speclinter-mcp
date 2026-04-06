import { Storage } from './storage.js';

/**
 * StorageManager centralizes creation of initialized Storage instances.
 * Initialization is explicit elsewhere in the product contract, so this helper
 * only opens existing SpecLinter state.
 */
export class StorageManager {
  /**
   * Creates and initializes a Storage instance for an already initialized project.
   */
  static async createInitializedStorage(rootDir?: string): Promise<Storage> {
    const storage = new Storage(rootDir);
    await storage.initialize();
    return storage;
  }
}
