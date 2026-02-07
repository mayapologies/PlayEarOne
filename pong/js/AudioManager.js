class AudioManager {
    constructor() {
        // Equivalent to pygame.mixer.pre_init
        this.audioCtx = null; 
        this.assetPath = "res/audio/";
        
        // Sound Banks (Empty arrays, just like your Python code)
        this.banks = {
            paddle_hits: [],
            wall_bounces: [],
            score_sounds: [],
            miss_sounds: []
        };

        this.isLoaded = false;
    }

    // Browsers require a user click to start audio. 
    // This function 'unlocks' the engine.
    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.loadAssets();
    }

    async loadSound(fileName) {
        const response = await fetch(this.assetPath + fileName);
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioCtx.decodeAudioData(arrayBuffer);
    }

    async loadAssets() {
        try {
            // Loading paddle hits (ping1, ping2, ping3, panclang)
            this.banks.paddle_hits = [
                await this.loadSound("ping1.wav"),
                await this.loadSound("ping2.wav"),
                await this.loadSound("ping3.wav"),
                await this.loadSound("panclang.wav")
            ];

            this.banks.wall_bounces = [
                await this.loadSound("battery_spring.wav")
            ];

            this.banks.miss_sounds = [
                await this.loadSound("whistle-upset-sound.wav")
            ];

            this.banks.score_sounds = [
                await this.loadSound("yay.wav"),
                await this.loadSound("yahoo.wav"),
                await this.loadSound("yeah.wav")
            ];

            this.isLoaded = true;
            console.log("Audio Engine: Assets loaded successfully.");
        } catch (e) {
            console.error("Audio Engine Error: Could not load assets.", e);
        }
    }

    // Helper: Equivalent to your _calculate_spatial_volume
    _createSpatialNode(x) {
        // Pan is -1.0 (Left) to 1.0 (Right)
        // Your x is 0.0 to 1.0, so we map it:
        const panValue = (x * 2) - 1;
        return new StereoPannerNode(this.audioCtx, { pan: panValue });
    }

    _playFromBank(bankName, x, volume = 1.0) {
        if (!this.isLoaded || !this.audioCtx) return;

        const bank = this.banks[bankName];
        const buffer = bank[Math.floor(Math.random() * bank.length)];

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;

        const panNode = this._createSpatialNode(x);
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = volume;

        // Source -> Pan -> Gain -> Destination
        source.connect(panNode).connect(gainNode).connect(this.audioCtx.destination);
        source.start(0);
    }

    // --- Public Functions (Mirroring your Pygame methods) ---

    play_hit(x, y, velocity) {
        // Map velocity to volume (equivalent to your vol_multiplier)
        const vol = Math.min(Math.max(velocity / 10.0, 0.3), 1.0);
        this._playFromBank('paddle_hits', x, vol);
    }

    play_bounce(x, y) {
        this._playFromBank('wall_bounces', x, 0.6);
    }

    play_score(winningPlayerId) {
        // If player 1 scores (left), ball is at right (1.0)
        const xPos = (winningPlayerId === 1) ? 1.0 : 0.0;
        this._playFromBank('score_sounds', xPos, 1.0);
    }

    play_miss(losingPlayerId) {
        const xPos = (losingPlayerId === 0) ? 1.0 : 0.0;
        this._playFromBank('miss_sounds', xPos, 1.0);
    }
}

// Global instance
const audioEngine = new AudioManager();