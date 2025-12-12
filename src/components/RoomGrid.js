import store from '../state/store.js';
import { ROOM_RANGES } from '../config/constants.js';

export class RoomGrid {
    constructor(containerElement) {
        this.container = containerElement;
        this.selectedRooms = new Set();
        this.onRoomSelect = null;
        this.filterShift = 'all'; // 'all', 'S', 'T', 'R'
        this.filterGender = 'all'; // 'all', 'Male', 'Female'
        this.filterStatus = 'all'; // 'all', 'inspected', 'uninspected'
    }

    render() {
        const rooms = this.generateRooms();
        const filteredRooms = this.applyFilters(rooms);

        this.container.innerHTML = `
            <div class="card">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="margin: 0;">Room Selection Grid</h2>
                        <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">
                            ${this.selectedRooms.size} rooms selected • ${filteredRooms.length} showing
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-small" onclick="window.selectAllRooms()">
                            ✓ Select All
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.clearSelection()">
                            × Clear Selection
                        </button>
                        <button class="btn btn-primary btn-small" onclick="window.createInspectionList()" ${this.selectedRooms.size === 0 ? 'disabled' : ''}>
                            📝 Create List
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                    <div>
                        <label style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 4px;">Shift</label>
                        <select id="shift-filter" class="form-select" style="padding: 6px 12px; font-size: 14px;" onchange="window.updateRoomFilters()">
                            <option value="all">All Shifts</option>
                            <option value="S">S - Swing</option>
                            <option value="T">T - Day</option>
                            <option value="R">R - Relief</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 4px;">Gender</label>
                        <select id="gender-filter" class="form-select" style="padding: 6px 12px; font-size: 14px;" onchange="window.updateRoomFilters()">
                            <option value="all">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 4px;">Status</label>
                        <select id="status-filter" class="form-select" style="padding: 6px 12px; font-size: 14px;" onchange="window.updateRoomFilters()">
                            <option value="all">All Rooms</option>
                            <option value="inspected">Inspected Today</option>
                            <option value="uninspected">Not Inspected</option>
                        </select>
                    </div>
                </div>

                <!-- Room Grid -->
                <div class="room-grid">
                    ${filteredRooms.map(room => this.renderRoomTile(room)).join('')}
                </div>

                ${filteredRooms.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏠</div>
                        <div>No rooms match the selected filters</div>
                    </div>
                ` : ''}
            </div>

            <!-- Inspection Lists -->
            <div class="card" style="margin-top: 20px;">
                <h2 style="margin-bottom: 16px;">Saved Inspection Lists</h2>
                <div id="inspection-lists-container">
                    ${this.renderInspectionLists()}
                </div>
            </div>
        `;
    }

    generateRooms() {
        const rooms = [];
        const roomProperties = store.getRoomProperties();
        const inspections = store.getInspections();

        // Floor 2
        for (let i = ROOM_RANGES.floor2.start; i <= ROOM_RANGES.floor2.end; i++) {
            rooms.push({
                number: i,
                floor: 2,
                properties: roomProperties[i] || {},
                inspected: this.isRoomInspectedToday(i, inspections)
            });
        }

        // Floor 3
        for (let i = ROOM_RANGES.floor3.start; i <= ROOM_RANGES.floor3.end; i++) {
            rooms.push({
                number: i,
                floor: 3,
                properties: roomProperties[i] || {},
                inspected: this.isRoomInspectedToday(i, inspections)
            });
        }

        return rooms;
    }

    isRoomInspectedToday(roomNumber, inspections) {
        const today = new Date().toISOString().split('T')[0];
        return inspections.some(insp =>
            insp.roomNumber === roomNumber.toString() &&
            insp.inspectionDate === today
        );
    }

    applyFilters(rooms) {
        return rooms.filter(room => {
            // Shift filter
            if (this.filterShift !== 'all' && room.properties.shift !== this.filterShift) {
                return false;
            }

            // Gender filter
            if (this.filterGender !== 'all' && room.properties.gender !== this.filterGender) {
                return false;
            }

            // Status filter
            if (this.filterStatus === 'inspected' && !room.inspected) {
                return false;
            }
            if (this.filterStatus === 'uninspected' && room.inspected) {
                return false;
            }

            return true;
        });
    }

    renderRoomTile(room) {
        const isSelected = this.selectedRooms.has(room.number);
        const shift = room.properties.shift;
        const gender = room.properties.gender;
        const inspected = room.inspected;

        return `
            <div
                class="room-tile ${isSelected ? 'selected' : ''} ${inspected ? 'inspected' : ''}"
                onclick="window.toggleRoom(${room.number})"
                title="Room ${room.number}${shift ? ` - Shift ${shift}` : ''}${gender ? ` - ${gender}` : ''}"
            >
                <div class="room-number">${room.number}</div>
                ${shift || gender ? `
                    <div class="room-badges">
                        ${shift ? `<span class="room-badge shift-${shift.toLowerCase()}">${shift}</span>` : ''}
                        ${gender ? `<span class="room-badge gender-badge">${gender.charAt(0)}</span>` : ''}
                    </div>
                ` : ''}
                ${inspected ? '<div class="room-inspected-badge">✓</div>' : ''}
            </div>
        `;
    }

    renderInspectionLists() {
        const lists = store.getInspectionLists();

        if (lists.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div>No saved inspection lists yet</div>
                </div>
            `;
        }

        return lists.map(list => `
            <div class="card" style="margin-bottom: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 16px;">${list.name}</strong>
                        <div style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">
                            ${list.rooms.length} rooms • Created ${new Date(list.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-small" onclick="window.loadInspectionList('${list.id}')">
                            📂 Load
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.deleteInspectionList('${list.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleRoom(roomNumber) {
        if (this.selectedRooms.has(roomNumber)) {
            this.selectedRooms.delete(roomNumber);
        } else {
            this.selectedRooms.add(roomNumber);
        }

        this.render();

        if (this.onRoomSelect) {
            this.onRoomSelect(Array.from(this.selectedRooms));
        }
    }

    selectAll() {
        const rooms = this.generateRooms();
        const filteredRooms = this.applyFilters(rooms);
        filteredRooms.forEach(room => this.selectedRooms.add(room.number));
        this.render();
    }

    clearSelection() {
        this.selectedRooms.clear();
        this.render();
    }

    updateFilters() {
        this.filterShift = document.getElementById('shift-filter')?.value || 'all';
        this.filterGender = document.getElementById('gender-filter')?.value || 'all';
        this.filterStatus = document.getElementById('status-filter')?.value || 'all';
        this.render();
    }

    getSelectedRooms() {
        return Array.from(this.selectedRooms);
    }

    loadList(rooms) {
        this.selectedRooms = new Set(rooms);
        this.render();
    }
}
