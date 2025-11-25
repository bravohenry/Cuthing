import { Project } from '../types';
import { db } from './db';
import { liveQuery } from 'dexie';

const API_KEY_STORAGE_key = 'gemini_api_key';

export const saveApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE_key, key);
};

export const loadApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_key) || '';
};

export const createNewProject = async (name: string = 'Untitled Project'): Promise<Project> => {
  const newProject: Project = {
    id: Date.now().toString(),
    name,
    date: new Date().toISOString(),
    duration: '00:00',
    lastModified: Date.now(),
    transcript: [],
    segments: [],
    messages: [],
    visualDescription: '',
    sequenceName: 'Main Sequence',
  };
  await db.projects.add(newProject);
  return newProject;
};

export const loadProjects = async (): Promise<Project[]> => {
  return await db.projects.orderBy('lastModified').reverse().toArray();
};

export const updateProject = async (project: Project) => {
  await db.projects.put({ ...project, lastModified: Date.now() });
};

export const deleteProject = async (id: string) => {
  await db.projects.delete(id);
};

export const useLiveProjects = () => {
    return liveQuery(() => db.projects.orderBy('lastModified').reverse().toArray());
}
