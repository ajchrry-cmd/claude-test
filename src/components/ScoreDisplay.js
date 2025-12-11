import { calculateInspectionResult } from '../utils/scoringUtils.js';

export class ScoreDisplay {
    constructor(containerElement) {
        this.container = containerElement;
        this.score = 0;
        this.status = 'OUTSTANDING';
        this.color = '#3b82f6';
    }

    render() {
        this.container.innerHTML = `
            <div id="score-display" class="score-display">
                <div class="score-number" id="score-number">0</div>
                <div class="score-label">Points</div>
                <div class="score-status" id="score-status">OUTSTANDING</div>
            </div>
        `;
    }

    update(regularDemerits, autoFailureDemerits) {
        const result = calculateInspectionResult(regularDemerits, autoFailureDemerits);

        this.score = result.score;
        this.status = result.status;
        this.color = result.color;

        const scoreNumber = this.container.querySelector('#score-number');
        const scoreStatus = this.container.querySelector('#score-status');
        const scoreDisplay = this.container.querySelector('#score-display');

        if (scoreNumber) {
            scoreNumber.textContent = this.score;
        }

        if (scoreStatus) {
            scoreStatus.textContent = this.status;
        }

        if (scoreDisplay) {
            scoreDisplay.className = `score-display ${result.statusClass}`;
            scoreDisplay.style.borderColor = this.color;
        }
    }

    getResult() {
        return {
            score: this.score,
            status: this.status,
            color: this.color
        };
    }
}
