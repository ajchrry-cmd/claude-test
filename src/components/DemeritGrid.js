import { DEMERITS, AUTO_FAILURE_DEMERITS } from '../config/constants.js';
import { vibrate } from '../utils/domUtils.js';
import store from '../state/store.js';

export class DemeritGrid {
    constructor(containerElement) {
        this.container = containerElement;
        this.selectedDemerits = new Set();
        this.selectedAutoFailures = new Set();
        this.onChange = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="demerits-section">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
                    Regular Demerits <span style="color: var(--text-muted); font-size: 14px;">(1 point each)</span>
                </h3>
                <div id="regular-demerits" class="demerits-grid"></div>
            </div>
            <div class="demerits-section" style="margin-top: 24px;">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--error);">
                    Auto-Failure Demerits <span style="color: var(--text-muted); font-size: 14px;">(4 points each)</span>
                </h3>
                <div id="auto-failure-demerits" class="demerits-grid"></div>
            </div>
        `;

        this.renderDemerits();
    }

    renderDemerits() {
        const regularContainer = this.container.querySelector('#regular-demerits');
        const autoContainer = this.container.querySelector('#auto-failure-demerits');

        if (!regularContainer || !autoContainer) return;

        regularContainer.innerHTML = '';
        autoContainer.innerHTML = '';

        DEMERITS.forEach((demerit, index) => {
            const item = this.createDemeritItem(demerit, index, 'regular');
            regularContainer.appendChild(item);
        });

        AUTO_FAILURE_DEMERITS.forEach((demerit, index) => {
            const item = this.createDemeritItem(demerit, index, 'auto-failure');
            autoContainer.appendChild(item);
        });
    }

    createDemeritItem(text, index, type) {
        const item = document.createElement('div');
        item.className = `demerit-item ${type === 'auto-failure' ? 'auto-failure' : ''}`;
        item.setAttribute('data-index', index);
        item.setAttribute('data-type', type);

        item.innerHTML = `
            <div class="demerit-checkbox"></div>
            <div class="demerit-text">${text}</div>
        `;

        item.addEventListener('click', () => {
            this.toggleDemerit(text, type, item);
        });

        return item;
    }

    toggleDemerit(demerit, type, element) {
        element.classList.toggle('checked');

        const settings = store.getSettings();

        if (type === 'auto-failure') {
            if (this.selectedAutoFailures.has(demerit)) {
                this.selectedAutoFailures.delete(demerit);
            } else {
                this.selectedAutoFailures.add(demerit);
            }
        } else {
            if (this.selectedDemerits.has(demerit)) {
                this.selectedDemerits.delete(demerit);
            } else {
                this.selectedDemerits.add(demerit);
            }
        }

        // Haptic feedback
        if (settings.hapticFeedback) {
            vibrate(element.classList.contains('checked') ? 30 : [20, 10, 20]);
        }

        if (this.onChange) {
            this.onChange({
                regular: Array.from(this.selectedDemerits),
                autoFailure: Array.from(this.selectedAutoFailures)
            });
        }
    }

    selectDemerit(demeritName) {
        const items = this.container.querySelectorAll('.demerit-item');
        let found = false;

        items.forEach(item => {
            const text = item.querySelector('.demerit-text');
            if (text && text.textContent.trim() === demeritName) {
                if (!item.classList.contains('checked')) {
                    item.click();
                    found = true;

                    // Visual feedback
                    item.style.animation = 'none';
                    setTimeout(() => {
                        item.style.animation = 'flash 0.5s ease';
                    }, 10);
                }
            }
        });

        return found;
    }

    getSelected() {
        return {
            regular: Array.from(this.selectedDemerits),
            autoFailure: Array.from(this.selectedAutoFailures)
        };
    }

    setSelected(regular = [], autoFailure = []) {
        this.selectedDemerits = new Set(regular);
        this.selectedAutoFailures = new Set(autoFailure);

        const items = this.container.querySelectorAll('.demerit-item');
        items.forEach(item => {
            const text = item.querySelector('.demerit-text').textContent.trim();
            const type = item.getAttribute('data-type');

            if (type === 'auto-failure' && this.selectedAutoFailures.has(text)) {
                item.classList.add('checked');
            } else if (type === 'regular' && this.selectedDemerits.has(text)) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        });
    }

    reset() {
        this.selectedDemerits.clear();
        this.selectedAutoFailures.clear();

        const items = this.container.querySelectorAll('.demerit-item');
        items.forEach(item => item.classList.remove('checked'));

        if (this.onChange) {
            this.onChange({ regular: [], autoFailure: [] });
        }
    }
}
