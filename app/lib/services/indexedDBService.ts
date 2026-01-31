/**
 * IndexedDB service for persisting step contents locally
 * Provides client-side persistence for presentation data
 */

import { StepContent } from "@/app/types/steps";

const DB_NAME = "prez-ai-db";
const DB_VERSION = 1;
const STORE_NAME = "presentations";
const CURRENT_PRESENTATION_KEY = "current_presentation";

export interface StoredPresentation {
  id: string;
  stepContents: StepContent;
  createdAt: Date;
  updatedAt: Date;
  generatedSlidesHTML?: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB database");
        reject(new Error("Failed to open IndexedDB database"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Save current presentation step contents
   */
  async saveStepContents(stepContents: StepContent, generatedSlidesHTML?: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const presentation: StoredPresentation = {
        id: CURRENT_PRESENTATION_KEY,
        stepContents,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedSlidesHTML,
      };

      const request = store.put(presentation);

      request.onerror = () => {
        reject(new Error("Failed to save step contents"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Load saved presentation step contents
   */
  async loadStepContents(): Promise<{ stepContents: StepContent; generatedSlidesHTML?: string } | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CURRENT_PRESENTATION_KEY);

      request.onerror = () => {
        reject(new Error("Failed to load step contents"));
      };

      request.onsuccess = () => {
        const presentation = request.result as StoredPresentation | undefined;
        
        if (presentation) {
          // Update the updatedAt timestamp
          this.updateLastAccessed(presentation.id).catch(console.error);
          
          resolve({
            stepContents: presentation.stepContents,
            generatedSlidesHTML: presentation.generatedSlidesHTML,
          });
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Update last accessed timestamp
   */
  private async updateLastAccessed(id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);

      getRequest.onerror = () => {
        reject(new Error("Failed to get presentation for update"));
      };

      getRequest.onsuccess = () => {
        const presentation = getRequest.result as StoredPresentation;
        if (presentation) {
          presentation.updatedAt = new Date();
          const updateRequest = store.put(presentation);
          
          updateRequest.onerror = () => {
            reject(new Error("Failed to update last accessed timestamp"));
          };
          
          updateRequest.onsuccess = () => {
            resolve();
          };
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Clear saved presentation data
   */
  async clearStepContents(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(CURRENT_PRESENTATION_KEY);

      request.onerror = () => {
        reject(new Error("Failed to clear step contents"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Save a presentation with a custom ID (for sharing/exporting)
   */
  async savePresentationWithId(
    id: string,
    stepContents: StepContent,
    generatedSlidesHTML?: string
  ): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const presentation: StoredPresentation = {
        id,
        stepContents,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedSlidesHTML,
      };

      const request = store.put(presentation);

      request.onerror = () => {
        reject(new Error("Failed to save presentation"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Load a presentation by ID
   */
  async loadPresentationById(id: string): Promise<{ stepContents: StepContent; generatedSlidesHTML?: string } | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => {
        reject(new Error("Failed to load presentation"));
      };

      request.onsuccess = () => {
        const presentation = request.result as StoredPresentation | undefined;
        
        if (presentation) {
          // Update the updatedAt timestamp
          this.updateLastAccessed(presentation.id).catch(console.error);
          
          resolve({
            stepContents: presentation.stepContents,
            generatedSlidesHTML: presentation.generatedSlidesHTML,
          });
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Get all saved presentations (excluding current)
   */
  async getAllPresentations(): Promise<StoredPresentation[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("updatedAt");
      const request = index.getAll();

      request.onerror = () => {
        reject(new Error("Failed to get all presentations"));
      };

      request.onsuccess = () => {
        const presentations = request.result as StoredPresentation[];
        // Filter out current presentation if needed
        const filtered = presentations.filter(p => p.id !== CURRENT_PRESENTATION_KEY);
        resolve(filtered);
      };
    });
  }

  /**
   * Delete a presentation by ID
   */
  async deletePresentation(id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error("Failed to delete presentation"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }

  /**
   * Get database size estimate
   */
  async getDatabaseSize(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => {
        reject(new Error("Failed to get database size"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

// Export class for static methods
export { IndexedDBService };

// Helper function to auto-save step contents with debouncing
export class StepContentsAutoSaver {
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 1000; // 1 second

  constructor(private onSave: (stepContents: StepContent, generatedSlidesHTML?: string) => Promise<void>) {}

  async save(stepContents: StepContent, generatedSlidesHTML?: string): Promise<void> {
    // Clear any pending save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          await this.onSave(stepContents, generatedSlidesHTML);
          resolve();
        } catch (error) {
          console.error("Failed to auto-save step contents:", error);
          resolve();
        }
      }, this.DEBOUNCE_DELAY);
    });
  }

  cancel(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}