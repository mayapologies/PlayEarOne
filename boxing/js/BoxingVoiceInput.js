class BoxingVoiceInput {
  constructor() {
    this.socket = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.enabled = false;
    this.commandTimers = {};

    this.commandMap = {
      'jab': 'jab', 'left': 'jab',
      'cross': 'cross', 'right': 'cross',
      'hook': 'hook',
      'uppercut': 'uppercut', 'upper': 'uppercut',
      'block': 'block', 'guard': 'block',
      'dodge': 'dodge', 'duck': 'dodge',
      'forward': 'forward', 'advance': 'forward',
      'back': 'back', 'retreat': 'back',
      'start': 'start', 'fight': 'start',
      'pause': 'pause'
    };

    // Debounce
    this.lastCommand = { 1: null, 2: null };
    this.lastCommandTime = { 1: 0, 2: 0 };
    this.debounceTime = 100;
  }

  async initialize() {
    console.log('[BoxingVoice] initialize');
    this.enabled = true;
    this.connectWebSocket();
    this.fetchPlayerAssignments();
    try {
      await this.startAudioCapture();
      console.log('[BoxingVoice] mic active');
    } catch (e) {
      console.error('[BoxingVoice] mic failed:', e);
      this.updateStatus('no-mic');
    }
  }

  async fetchPlayerAssignments() {
    try {
      const host = location.host || 'localhost:8000';
      const res = await fetch(`${location.protocol}//${host}/api/config`);
      const data = await res.json();
      const assignments = data.player_assignments || {};

      for (const [name, playerNum] of Object.entries(assignments)) {
        const el = document.getElementById(`player${playerNum}Name`);
        if (el) {
          el.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        }
      }
      console.log('[BoxingVoice] assignments:', assignments);
    } catch (e) {
      console.error('[BoxingVoice] failed to fetch assignments:', e);
    }
  }

  connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host || 'localhost:8000';
    const url = `${protocol}//${host}/ws`;
    console.log('[BoxingVoice] connecting to', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[BoxingVoice] connected');
      this.socket.send(JSON.stringify({ type: 'start_listening' }));
      this.updateStatus('connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'command' && data.player && data.command) {
        this.handleVoiceCommand(data.player, data.command, data.command_confidence);
      }
    };

    this.socket.onclose = () => {
      this.updateStatus('disconnected');
      if (this.enabled) {
        setTimeout(() => this.connectWebSocket(), 2000);
      }
    };

    this.socket.onerror = () => {
      this.updateStatus('error');
    };
  }

  handleVoiceCommand(player, command, confidence) {
    if (confidence < 0.65) return;

    const action = this.commandMap[command];
    if (!action) return;

    // Debounce
    const now = performance.now();
    if (this.lastCommand[player] === action &&
        now - this.lastCommandTime[player] < this.debounceTime) {
      return;
    }
    this.lastCommand[player] = action;
    this.lastCommandTime[player] = now;

    // Route to game
    if (window.boxingGame) {
      if (action === 'start') {
        window.boxingGame.startMatch();
      } else if (action === 'pause') {
        window.boxingGame.togglePause();
      } else {
        window.boxingGame.handleCommand(player, action);
      }
    }

    this.showCommand(player, action);
    console.log(`[BoxingVoice] P${player}: ${action} (${confidence.toFixed(2)})`);
  }

  showCommand(player, command) {
    const el = document.getElementById(`player${player}Cmd`);
    if (!el) return;

    el.textContent = command.toUpperCase();
    el.classList.add('active');

    if (this.commandTimers[player]) {
      clearTimeout(this.commandTimers[player]);
    }

    this.commandTimers[player] = setTimeout(() => {
      el.classList.remove('active');
      delete this.commandTimers[player];
    }, 600);
  }

  async startAudioCapture() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1 }
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const float32 = event.inputBuffer.getChannelData(0);
        const pcm16 = this.float32ToPCM16(float32);
        this.socket.send(pcm16.buffer);
      }
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  float32ToPCM16(float32Array) {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }
    return pcm16;
  }

  updateStatus(state) {
    const el = document.getElementById('voiceStatus');
    if (!el) return;

    const labels = {
      connected: 'Voice: Connected',
      disconnected: 'Voice: Disconnected',
      error: 'Voice: Error',
      'no-mic': 'Voice: No Microphone'
    };
    el.textContent = labels[state] || 'Voice: Unknown';
    el.style.color = state === 'connected' ? '#4a4' : '#666';
  }

  destroy() {
    this.enabled = false;
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.socket) this.socket.close();
  }
}
