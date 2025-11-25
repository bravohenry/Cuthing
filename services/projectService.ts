import { Project } from '../types';

const STORAGE_KEY = 'cuthing_projects';
const API_KEY_STORAGE_KEY = 'cuthing_api_key';

export const saveProjects = (projects: Project[]) => {
    try {
        // We need to be careful about storage limits. 
        // If projects get too big, we might need to compress or warn.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save projects to localStorage", error);
        // Potential fallback: alert user or try to save only critical data
    }
};

export const loadProjects = (): Project[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load projects", error);
        return [];
    }
};

export const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const loadApiKey = (): string => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

export const createNewProject = (name: string = 'Untitled Project'): Project => {
    return {
        id: Date.now().toString(),
        name,
        date: new Date().toLocaleDateString(),
        duration: '00:00',
        lastModified: Date.now(),
        transcript: [],
        segments: [],
        messages: [],
        visualDescription: '',
        sequenceName: 'Main Sequence'
    };
};
