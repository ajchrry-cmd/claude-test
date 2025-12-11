import { STORAGE_KEY } from '../config/constants.js';

class StorageService {
    constructor() {
        this.storageKey = STORAGE_KEY;
    }

    save(key, data) {
        try {
            const stored = this.getAll();
            stored[key] = data;
            localStorage.setItem(this.storageKey, JSON.stringify(stored));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const stored = this.getAll();
            return stored[key] !== undefined ? stored[key] : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error parsing localStorage:', error);
            return {};
        }
    }

    remove(key) {
        try {
            const stored = this.getAll();
            delete stored[key];
            localStorage.setItem(this.storageKey, JSON.stringify(stored));
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

export default new StorageService();
