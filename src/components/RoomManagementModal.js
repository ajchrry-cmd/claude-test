import store from '../state/store.js';
import storageService from '../services/storageService.js';
import { ROOM_RANGES } from '../config/constants.js';

export class RoomManagementModal {
    constructor(containerElement) {
        this.container = containerElement;
        this.selectedRooms = new Set();
        this.onClose = null;
    }

    show() {
        const roomProperties = store.getRoomProperties();

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.closeRoomManagement()">
                <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>🏠 Room Management</h2>
                        <button class="modal-close" onclick="window.closeRoomManagement()">×</button>
                    </div>

                    <div class="modal-body">
                        <!-- Info Banner -->
                        <div style="background: var(--primary-light); border-left: 4px solid var(--primary); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                                ℹ️ Bulk Room Management
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">
                                Select rooms and assign gender and shift in bulk. Click rooms to select/deselect, or use the preset buttons.
                            </div>
                        </div>

                        <!-- Quick Stats -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
                            ${this.renderStats(roomProperties)}
                        </div>

                        <!-- Selection Controls -->
                        <div style="background: var(--surface-light); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                                <button class="btn btn-secondary btn-small" onclick="window.selectAllRooms()">✓ Select All</button>
                                <button class="btn btn-secondary btn-small" onclick="window.deselectAllRooms()">✕ Deselect All</button>
                                <button class="btn btn-secondary btn-small" onclick="window.selectRoomsByFloor(100)">100s</button>
                                <button class="btn btn-secondary btn-small" onclick="window.selectRoomsByFloor(200)">200s</button>
                                <button class="btn btn-secondary btn-small" onclick="window.selectRoomsByFloor(300)">300s</button>
                                <button class="btn btn-secondary btn-small" onclick="window.selectRoomsByFloor(400)">400s</button>
                            </div>
                            <div id="selection-count" style="font-size: 14px; color: var(--text-muted);">
                                No rooms selected
                            </div>
                        </div>

                        <!-- Bulk Actions -->
                        <div style="background: var(--surface-light); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">
                                Bulk Actions (Apply to Selected Rooms)
                            </h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 12px;">Set Gender</label>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-primary btn-small" onclick="window.bulkSetGender('Male')" style="flex: 1;">♂ Male</button>
                                        <button class="btn btn-primary btn-small" onclick="window.bulkSetGender('Female')" style="flex: 1;">♀ Female</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 12px;">Set Shift</label>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-primary btn-small" onclick="window.bulkSetShift('1st')" style="flex: 1;">1st Shift</button>
                                        <button class="btn btn-primary btn-small" onclick="window.bulkSetShift('2nd')" style="flex: 1;">2nd Shift</button>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top: 12px;">
                                <button class="btn btn-danger btn-small" onclick="window.bulkClearProperties()" style="width: 100%;">
                                    🗑️ Clear Properties for Selected Rooms
                                </button>
                            </div>
                        </div>

                        <!-- Quick Presets -->
                        <div style="background: var(--surface-light); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">
                                Quick Presets
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <button class="btn btn-secondary btn-small" onclick="window.applyPreset('male-1st')">♂ Male 1st Shift</button>
                                <button class="btn btn-secondary btn-small" onclick="window.applyPreset('male-2nd')">♂ Male 2nd Shift</button>
                                <button class="btn btn-secondary btn-small" onclick="window.applyPreset('female-1st')">♀ Female 1st Shift</button>
                                <button class="btn btn-secondary btn-small" onclick="window.applyPreset('female-2nd')">♀ Female 2nd Shift</button>
                            </div>
                        </div>

                        <!-- Filter View -->
                        <div style="margin-bottom: 12px;">
                            <label class="form-label">Filter View</label>
                            <select id="room-filter" class="form-select" onchange="window.filterRoomView()" style="max-width: 300px;">
                                <option value="all">All Rooms</option>
                                <option value="configured">Configured Only</option>
                                <option value="unconfigured">Unconfigured Only</option>
                                <option value="male">Male Only</option>
                                <option value="female">Female Only</option>
                                <option value="1st">1st Shift Only</option>
                                <option value="2nd">2nd Shift Only</option>
                            </select>
                        </div>

                        <!-- Room Grid -->
                        <div id="room-management-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;">
                            ${this.renderRoomGrid(roomProperties)}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-danger" onclick="window.clearAllRoomProperties()">🗑️ Clear All Properties</button>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" onclick="window.closeRoomManagement()">Close</button>
                            <button class="btn btn-primary" onclick="window.saveRoomManagement()">💾 Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.style.display = 'block';
    }

    renderStats(roomProperties) {
        const totalRooms = this.getAllRoomNumbers().length;
        const configuredRooms = Object.keys(roomProperties).length;
        const maleRooms = Object.values(roomProperties).filter(p => p.gender === 'Male').length;
        const femaleRooms = Object.values(roomProperties).filter(p => p.gender === 'Female').length;

        return `
            <div class="stat-card" style="background: var(--surface-light); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${totalRooms}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Total Rooms</div>
            </div>
            <div class="stat-card" style="background: var(--surface-light); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${configuredRooms}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Configured</div>
            </div>
            <div class="stat-card" style="background: var(--surface-light); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 800; color: var(--accent);">${maleRooms}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Male</div>
            </div>
            <div class="stat-card" style="background: var(--surface-light); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 800; color: var(--secondary);">${femaleRooms}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Female</div>
            </div>
        `;
    }

    renderRoomGrid(roomProperties, filter = 'all') {
        const allRooms = this.getAllRoomNumbers();
        const filteredRooms = this.filterRooms(allRooms, roomProperties, filter);

        return filteredRooms.map(roomNum => {
            const props = roomProperties[roomNum] || {};
            const isSelected = this.selectedRooms.has(roomNum);
            const hasProps = props.gender || props.shift;

            return `
                <div
                    class="room-mgmt-card ${isSelected ? 'selected' : ''} ${hasProps ? 'configured' : 'unconfigured'}"
                    data-room="${roomNum}"
                    onclick="window.toggleRoomSelection(${roomNum})"
                    style="
                        padding: 12px;
                        border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'};
                        background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        text-align: center;
                    "
                >
                    <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                        ${roomNum}
                    </div>
                    ${props.gender ? `
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">
                            ${props.gender === 'Male' ? '♂' : '♀'} ${props.gender}
                        </div>
                    ` : ''}
                    ${props.shift ? `
                        <div style="font-size: 11px; color: var(--text-secondary);">
                            ${props.shift} Shift
                        </div>
                    ` : ''}
                    ${!hasProps ? `
                        <div style="font-size: 11px; color: var(--text-muted);">
                            Not set
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    getAllRoomNumbers() {
        const rooms = [];
        ROOM_RANGES.forEach(range => {
            for (let i = range.start; i <= range.end; i++) {
                rooms.push(i);
            }
        });
        return rooms;
    }

    filterRooms(rooms, roomProperties, filter) {
        switch (filter) {
            case 'configured':
                return rooms.filter(r => roomProperties[r]);
            case 'unconfigured':
                return rooms.filter(r => !roomProperties[r]);
            case 'male':
                return rooms.filter(r => roomProperties[r]?.gender === 'Male');
            case 'female':
                return rooms.filter(r => roomProperties[r]?.gender === 'Female');
            case '1st':
                return rooms.filter(r => roomProperties[r]?.shift === '1st');
            case '2nd':
                return rooms.filter(r => roomProperties[r]?.shift === '2nd');
            default:
                return rooms;
        }
    }

    toggleRoomSelection(roomNum) {
        if (this.selectedRooms.has(roomNum)) {
            this.selectedRooms.delete(roomNum);
        } else {
            this.selectedRooms.add(roomNum);
        }
        this.updateSelectionUI();
    }

    selectAllRooms() {
        const allRooms = this.getAllRoomNumbers();
        allRooms.forEach(room => this.selectedRooms.add(room));
        this.updateSelectionUI();
    }

    deselectAllRooms() {
        this.selectedRooms.clear();
        this.updateSelectionUI();
    }

    selectRoomsByFloor(floor) {
        this.deselectAllRooms();
        const allRooms = this.getAllRoomNumbers();
        const floorRooms = allRooms.filter(room => Math.floor(room / 100) === Math.floor(floor / 100));
        floorRooms.forEach(room => this.selectedRooms.add(room));
        this.updateSelectionUI();
    }

    bulkSetGender(gender) {
        if (this.selectedRooms.size === 0) {
            alert('Please select at least one room first');
            return;
        }

        const roomProperties = store.getRoomProperties();
        this.selectedRooms.forEach(roomNum => {
            if (!roomProperties[roomNum]) {
                roomProperties[roomNum] = {};
            }
            roomProperties[roomNum].gender = gender;
        });

        store.setState({ roomProperties });
        this.refreshGrid();
        this.updateStats();
    }

    bulkSetShift(shift) {
        if (this.selectedRooms.size === 0) {
            alert('Please select at least one room first');
            return;
        }

        const roomProperties = store.getRoomProperties();
        this.selectedRooms.forEach(roomNum => {
            if (!roomProperties[roomNum]) {
                roomProperties[roomNum] = {};
            }
            roomProperties[roomNum].shift = shift;
        });

        store.setState({ roomProperties });
        this.refreshGrid();
        this.updateStats();
    }

    bulkClearProperties() {
        if (this.selectedRooms.size === 0) {
            alert('Please select at least one room first');
            return;
        }

        const confirmed = confirm(`Clear properties for ${this.selectedRooms.size} selected room(s)?`);
        if (!confirmed) return;

        const roomProperties = store.getRoomProperties();
        this.selectedRooms.forEach(roomNum => {
            delete roomProperties[roomNum];
        });

        store.setState({ roomProperties });
        this.deselectAllRooms();
        this.refreshGrid();
        this.updateStats();
    }

    applyPreset(preset) {
        if (this.selectedRooms.size === 0) {
            alert('Please select at least one room first');
            return;
        }

        const [gender, shift] = preset.split('-');
        const genderValue = gender === 'male' ? 'Male' : 'Female';
        const shiftValue = shift === '1st' ? '1st' : '2nd';

        const roomProperties = store.getRoomProperties();
        this.selectedRooms.forEach(roomNum => {
            roomProperties[roomNum] = {
                gender: genderValue,
                shift: shiftValue
            };
        });

        store.setState({ roomProperties });
        this.refreshGrid();
        this.updateStats();
    }

    clearAllRoomProperties() {
        const confirmed = confirm('Are you sure you want to clear ALL room properties? This cannot be undone.');
        if (!confirmed) return;

        const doubleConfirm = confirm('This will remove gender and shift assignments for ALL rooms. Are you absolutely sure?');
        if (!doubleConfirm) return;

        store.setState({ roomProperties: {} });
        this.deselectAllRooms();
        this.refreshGrid();
        this.updateStats();
    }

    filterRoomView() {
        const filter = document.getElementById('room-filter')?.value || 'all';
        this.refreshGrid(filter);
    }

    refreshGrid(filter = 'all') {
        const roomProperties = store.getRoomProperties();
        const gridEl = document.getElementById('room-management-grid');
        if (gridEl) {
            gridEl.innerHTML = this.renderRoomGrid(roomProperties, filter);
        }
    }

    updateSelectionUI() {
        // Update selection count
        const countEl = document.getElementById('selection-count');
        if (countEl) {
            const count = this.selectedRooms.size;
            countEl.textContent = count === 0
                ? 'No rooms selected'
                : `${count} room${count > 1 ? 's' : ''} selected`;
        }

        // Update room cards
        document.querySelectorAll('.room-mgmt-card').forEach(card => {
            const roomNum = parseInt(card.dataset.room);
            const isSelected = this.selectedRooms.has(roomNum);

            card.classList.toggle('selected', isSelected);
            card.style.border = `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`;
            card.style.background = isSelected ? 'var(--primary-light)' : 'var(--surface)';
        });
    }

    updateStats() {
        const roomProperties = store.getRoomProperties();
        const statsContainer = document.querySelector('.modal-body > div:nth-child(2)');
        if (statsContainer) {
            statsContainer.innerHTML = this.renderStats(roomProperties);
        }
    }

    save() {
        const roomProperties = store.getRoomProperties();
        storageService.save('roomProperties', roomProperties);
        alert('✅ Room properties saved successfully!');
    }

    close() {
        this.selectedRooms.clear();
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        if (this.onClose) {
            this.onClose();
        }
    }
}
