import { DEFAULT_SETTINGS } from '../config/settings.js';

class Store {
    constructor() {
        this.state = {
            inspections: [],
            settings: { ...DEFAULT_SETTINGS },
            activeTab: 'inspect',
            editingInspection: null,
            inspectionLists: [],
            activeListId: null,
            isLoading: false,
            roomProperties: this.initializeRoomProperties(),
            isConnected: false,
            currentInspection: {
                roomNumber: '',
                inspectorName: '',
                shift: '',
                gender: '',
                date: '',
                regularDemerits: [],
                autoFailureDemerits: []
            }
        };

        this.listeners = new Map();
    }

    initializeRoomProperties() {
        // Initialize default room properties (can be loaded from storage)
        const props = {};
        // You can populate this with actual room data if needed
        return props;
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Notify listeners
        Object.keys(updates).forEach(key => {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(this.state[key], prevState[key]);
                });
            }
        });

        // Notify global listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                callback(this.state, prevState);
            });
        }
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    // Inspections
    getInspections() {
        return [...this.state.inspections];
    }

    setInspections(inspections) {
        this.setState({ inspections });
    }

    addInspection(inspection) {
        this.setState({
            inspections: [inspection, ...this.state.inspections]
        });
    }

    updateInspection(id, updates) {
        this.setState({
            inspections: this.state.inspections.map(insp =>
                insp.id === id ? { ...insp, ...updates } : insp
            )
        });
    }

    deleteInspection(id) {
        this.setState({
            inspections: this.state.inspections.filter(insp => insp.id !== id)
        });
    }

    clearInspections() {
        this.setState({ inspections: [] });
    }

    // Settings
    getSettings() {
        return { ...this.state.settings };
    }

    setSettings(settings) {
        this.setState({ settings });
    }

    updateSettings(updates) {
        this.setState({
            settings: { ...this.state.settings, ...updates }
        });
    }

    // Active Tab
    getActiveTab() {
        return this.state.activeTab;
    }

    setActiveTab(tab) {
        this.setState({ activeTab: tab });
    }

    // Editing
    setEditingInspection(inspection) {
        this.setState({ editingInspection: inspection });
    }

    clearEditingInspection() {
        this.setState({ editingInspection: null });
    }

    // Inspection Lists
    getInspectionLists() {
        return [...this.state.inspectionLists];
    }

    setInspectionLists(lists) {
        this.setState({ inspectionLists: lists });
    }

    addInspectionList(list) {
        this.setState({
            inspectionLists: [...this.state.inspectionLists, list]
        });
    }

    updateInspectionList(id, updates) {
        this.setState({
            inspectionLists: this.state.inspectionLists.map(list =>
                list.id === id ? { ...list, ...updates } : list
            )
        });
    }

    deleteInspectionList(id) {
        this.setState({
            inspectionLists: this.state.inspectionLists.filter(list => list.id !== id)
        });
    }

    // Active List
    getActiveListId() {
        return this.state.activeListId;
    }

    setActiveListId(id) {
        this.setState({ activeListId: id });
    }

    getActiveList() {
        if (!this.state.activeListId) return null;
        return this.state.inspectionLists.find(list => list.id === this.state.activeListId);
    }

    // Loading
    setLoading(isLoading) {
        this.setState({ isLoading });
    }

    // Connection
    setConnected(isConnected) {
        this.setState({ isConnected });
    }

    // Room Properties
    getRoomProperties() {
        return { ...this.state.roomProperties };
    }

    setRoomProperty(roomNumber, properties) {
        this.setState({
            roomProperties: {
                ...this.state.roomProperties,
                [roomNumber]: { ...this.state.roomProperties[roomNumber], ...properties }
            }
        });
    }

    // Current Inspection (form state)
    getCurrentInspection() {
        return { ...this.state.currentInspection };
    }

    updateCurrentInspection(updates) {
        this.setState({
            currentInspection: { ...this.state.currentInspection, ...updates }
        });
    }

    clearCurrentInspection() {
        this.setState({
            currentInspection: {
                roomNumber: '',
                inspectorName: '',
                shift: '',
                gender: '',
                date: '',
                regularDemerits: [],
                autoFailureDemerits: []
            }
        });
    }
}

export default new Store();
