import Dexie, { Table } from 'dexie';
import { Project } from '../types';

export class AppDB extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super('ChatCutDB');
    this.version(1).stores({
      projects: '++id, name, lastModified',
    });
    this.projects = this.table('projects');
  }
}

export const db = new AppDB();
