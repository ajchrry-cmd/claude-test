import { firebaseConfig } from '../config/firebase.js';

class FirebaseService {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.onConnectionChange = null;
    }

    async initialize() {
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.warn('Firebase not loaded');
                this.isConnected = false;
                return false;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();

            // Test connection
            await this.testConnection();

            this.isConnected = true;
            console.log('Firebase initialized successfully');

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }

            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.isConnected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false, error.message);
            }

            return false;
        }
    }

    async testConnection() {
        try {
            await this.db.collection('test').limit(1).get();
            return true;
        } catch (error) {
            throw new Error('Connection test failed');
        }
    }

    async saveInspection(inspection) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            const docRef = await this.db.collection('inspections').add({
                ...inspection,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Inspection saved:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving inspection:', error);
            throw error;
        }
    }

    async getInspections() {
        if (!this.isConnected) {
            console.warn('Firebase not connected, returning empty array');
            return [];
        }

        try {
            const snapshot = await this.db.collection('inspections')
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching inspections:', error);
            return [];
        }
    }

    async updateInspection(id, data) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            await this.db.collection('inspections').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Inspection updated:', id);
        } catch (error) {
            console.error('Error updating inspection:', error);
            throw error;
        }
    }

    async deleteInspection(id) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            await this.db.collection('inspections').doc(id).delete();
            console.log('Inspection deleted:', id);
        } catch (error) {
            console.error('Error deleting inspection:', error);
            throw error;
        }
    }

    async deleteAllInspections() {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            const snapshot = await this.db.collection('inspections').get();
            const batch = this.db.batch();

            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log('All inspections deleted');
        } catch (error) {
            console.error('Error deleting all inspections:', error);
            throw error;
        }
    }

    async saveInspectionLists(lists) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            await this.db.collection('settings').doc('inspectionLists').set({ lists });
            console.log('Inspection lists saved');
        } catch (error) {
            console.error('Error saving inspection lists:', error);
            throw error;
        }
    }

    async getInspectionLists() {
        if (!this.isConnected) {
            return [];
        }

        try {
            const doc = await this.db.collection('settings').doc('inspectionLists').get();
            return doc.exists ? (doc.data().lists || []) : [];
        } catch (error) {
            console.error('Error fetching inspection lists:', error);
            return [];
        }
    }
}

export default new FirebaseService();
