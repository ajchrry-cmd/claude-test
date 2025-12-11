class VoiceService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onTranscript = null;
        this.onMatch = null;
        this.onError = null;
        this.onStateChange = null;
    }

    initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('')
                .toLowerCase();

            if (this.onTranscript) {
                this.onTranscript(transcript);
            }

            const matches = this.matchTranscriptToDemerits(transcript);
            if (matches.length > 0 && this.onMatch) {
                matches.forEach(match => this.onMatch(match));
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.onError) {
                this.onError(event.error);
            }
            this.stop();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                    this.isListening = false;
                    if (this.onStateChange) {
                        this.onStateChange(false);
                    }
                }
            }
        };

        console.log('Voice recognition initialized');
        return true;
    }

    start() {
        if (!this.recognition) {
            if (!this.initialize()) {
                return false;
            }
        }

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('Voice recognition started');

            if (this.onStateChange) {
                this.onStateChange(true);
            }

            return true;
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            return false;
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        console.log('Voice recognition stopped');

        if (this.onStateChange) {
            this.onStateChange(false);
        }
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
        return this.isListening;
    }

    matchTranscriptToDemerits(transcript) {
        const demeritKeywords = this.buildKeywordMap();
        const matches = [];
        const seen = new Set();

        for (const [keyword, demeritName] of Object.entries(demeritKeywords)) {
            if (transcript.includes(keyword) && !seen.has(demeritName)) {
                matches.push(demeritName);
                seen.add(demeritName);
            }
        }

        return matches;
    }

    buildKeywordMap() {
        return {
            // Regular demerits
            'bed': 'Bed not made or missing 341',
            '341': 'Bed not made or missing 341',
            'mirror': 'Mirror',
            'vanity': 'Vanity/Sink',
            'sink': 'Vanity/Sink',
            'tile': 'Dirty tile or Carpet',
            'carpet': 'Dirty tile or Carpet',
            'dirty': 'Dirty tile or Carpet',
            'odor': 'Foul odor',
            'smell': 'Foul odor',
            'foul': 'Foul odor',
            'dust': 'High dust or excessive clutter',
            'clutter': 'High dust or excessive clutter',
            'trash': 'Trash',
            'garbage': 'Trash',
            'fridge': 'Fridge, freezer, or microwave',
            'freezer': 'Fridge, freezer, or microwave',
            'microwave': 'Fridge, freezer, or microwave',
            'appliance': 'Fridge, freezer, or microwave',
            'shower curtain': 'Shower curtain',
            'curtain': 'Shower curtain',
            'bathtub': 'Bathtub/shower',
            'tub': 'Bathtub/shower',
            'shower': 'Bathtub/shower',
            'mold': 'Excessive mold build-up',
            'mildew': 'Excessive mold build-up',
            'toilet': 'Toilet',
            'bathroom tile': 'Dirty bathroom tile, rugs, or towels',
            'rugs': 'Dirty bathroom tile, rugs, or towels',
            'towel': 'Dirty bathroom tile, rugs, or towels',
            'towels': 'Dirty bathroom tile, rugs, or towels',
            'bath mat': 'Dirty bathroom tile, rugs, or towels',
            // Auto-failure demerits
            'hazmat': 'HAZMAT',
            'flammable': 'HAZMAT',
            'locker': 'Unsecured wall locker or keys',
            'wall locker': 'Unsecured wall locker or keys',
            'key': 'Unsecured wall locker or keys',
            'keys': 'Unsecured wall locker or keys',
            'valuables': 'Unsecured valuables or uniforms',
            'valuable': 'Unsecured valuables or uniforms',
            'uniforms': 'Unsecured valuables or uniforms',
            'uniform': 'Unsecured valuables or uniforms',
            'medication': 'Unsecured prescription medications',
            'medications': 'Unsecured prescription medications',
            'prescription': 'Unsecured prescription medications',
            'prescriptions': 'Unsecured prescription medications',
            'tobacco': 'Unsecured Tobacco',
            'cigarette': 'Unsecured Tobacco',
            'cigarettes': 'Unsecured Tobacco',
            'vape': 'Unsecured Tobacco',
            'perishable': 'Unsecured perishable food',
            'perishables': 'Unsecured perishable food',
            'food': 'Unsecured perishable food',
            'contraband': 'Contraband',
            'safety': 'Safety items/open window',
            'window': 'Safety items/open window',
            'open window': 'Safety items/open window',
            'to go': 'To-go container/pizza box',
            'togo': 'To-go container/pizza box',
            'container': 'To-go container/pizza box',
            'pizza': 'To-go container/pizza box',
            'pizza box': 'To-go container/pizza box'
        };
    }
}

export default new VoiceService();
