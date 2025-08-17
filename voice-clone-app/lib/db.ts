import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Define the model interface
export interface VoiceModel {
  id: string;
  fish_model_id: string;
  title: string;
  created_at: string;
  name?: string; // For backward compatibility
  description?: string; // For backward compatibility
  fishAudioId?: string; // For backward compatibility
}

// Define the input type for saving models (without id and created_at)
export interface SaveModelInput {
  fish_model_id: string;
  title: string;
}

// Legacy interface for backward compatibility
export interface CreateModelInput {
  name: string;
  description?: string;
  fishAudioId: string;
}

class DatabaseWrapper {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'voice-clone.db');
    this.db = new Database(this.dbPath);
    
    // Initialize database on first run
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Create models table if it doesn't exist
    const createModelsTable = `
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        fish_model_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.db.exec(createModelsTable);
  }

  /**
   * Get all voice models from the database
   */
  public getModels(): VoiceModel[] {
    const stmt = this.db.prepare('SELECT * FROM models ORDER BY created_at DESC');
    return stmt.all() as VoiceModel[];
  }

  /**
   * Save a new voice model to the database
   */
  public saveModel(modelData: SaveModelInput): VoiceModel {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO models (id, fish_model_id, title, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    stmt.run(id, modelData.fish_model_id, modelData.title);
    
    // Return the saved model
    return this.getModelById(id)!;
  }

  /**
   * Get a specific voice model by its ID
   */
  public getModelById(id: string): VoiceModel | null {
    const stmt = this.db.prepare('SELECT * FROM models WHERE id = ?');
    const result = stmt.get(id) as VoiceModel | undefined;
    return result || null;
  }

  /**
   * Get a specific voice model by its fish_model_id
   */
  public getModelByFishId(fishModelId: string): VoiceModel | null {
    const stmt = this.db.prepare('SELECT * FROM models WHERE fish_model_id = ?');
    const result = stmt.get(fishModelId) as VoiceModel | undefined;
    return result || null;
  }

  /**
   * Delete a voice model by its ID
   */
  public deleteModel(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM models WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update a voice model's title
   */
  public updateModelTitle(id: string, title: string): boolean {
    const stmt = this.db.prepare('UPDATE models SET title = ? WHERE id = ?');
    const result = stmt.run(title, id);
    return result.changes > 0;
  }

  /**
   * Generate a unique ID for models
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Close the database connection
   */
  public close(): void {
    this.db.close();
  }

  /**
   * Get database statistics
   */
  public getStats(): { totalModels: number; dbPath: string } {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM models');
    const result = stmt.get() as { count: number };
    
    return {
      totalModels: result.count,
      dbPath: this.dbPath
    };
  }

  // Legacy methods for backward compatibility with existing API routes
  
  /**
   * Get all models (legacy method name)
   */
  public getAllModels(): VoiceModel[] {
    return this.getModels();
  }

  /**
   * Get model by name (legacy method)
   */
  public getModelByName(name: string): VoiceModel | null {
    const stmt = this.db.prepare('SELECT * FROM models WHERE title = ?');
    const result = stmt.get(name) as VoiceModel | undefined;
    return result || null;
  }

  /**
   * Create model with legacy interface
   */
  public createModel(modelData: CreateModelInput): VoiceModel {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO models (id, fish_model_id, title, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    stmt.run(id, modelData.fishAudioId, modelData.name);
    
    // Return the saved model with legacy fields
    const savedModel = this.getModelById(id)!;
    return {
      ...savedModel,
      name: savedModel.title,
      description: modelData.description,
      fishAudioId: savedModel.fish_model_id
    };
  }
}

// Create a singleton instance
let dbInstance: DatabaseWrapper | null = null;

/**
 * Get the database instance (singleton pattern)
 */
export function getDatabase(): DatabaseWrapper {
  if (!dbInstance) {
    dbInstance = new DatabaseWrapper();
  }
  return dbInstance;
}

/**
 * Legacy function name for backward compatibility
 */
export function getDB(): DatabaseWrapper {
  return getDatabase();
}

// Export convenience functions that use the singleton instance
export function getModels(): VoiceModel[] {
  return getDatabase().getModels();
}

export function saveModel(modelData: SaveModelInput): VoiceModel {
  return getDatabase().saveModel(modelData);
}

export function getModelById(id: string): VoiceModel | null {
  return getDatabase().getModelById(id);
}

export function getModelByFishId(fishModelId: string): VoiceModel | null {
  return getDatabase().getModelByFishId(fishModelId);
}

export function deleteModel(id: string): boolean {
  return getDatabase().deleteModel(id);
}

export function updateModelTitle(id: string, title: string): boolean {
  return getDatabase().updateModelTitle(id, title);
}

export function getDatabaseStats(): { totalModels: number; dbPath: string } {
  return getDatabase().getStats();
}

// Cleanup function for graceful shutdown
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}