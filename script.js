// Estado global do metrônomo
const state = {
    isPlaying: false,
    bpm: 100,
    division: 4,
    beatsPerMeasure: 4,
    subdivisionsPerBeat: 1,
    currentMeasure: 0,
    currentBeat: 0,
    currentSubdivision: 0,
    timerId: null,
    currentTheme: 'default'
};

// Elementos da interface
const elements = {
    bpmDisplay: document.querySelector('.bpm-display'),
    bpmSlider: document.querySelector('.bpm-slider'),
    rhythmButtons: document.querySelectorAll('.rhythm-btn'),
    timeButtons: document.querySelectorAll('.time-btn'),
    presetButtons: document.querySelectorAll('.preset-btn'),
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    resetBtn: document.getElementById('reset-btn'),
    pulse: document.querySelector('.pulse'),
    measuresContainer: document.getElementById('measures-container'),
    themeToggle: document.getElementById('theme-toggle')
};

// Garante que o botão Parar fique oculto ao carregar
if (elements.stopBtn) {
    elements.stopBtn.style.display = 'none';
}

// Contexto de áudio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Configuração padrão
const defaultConfig = {
    bpm: 100,
    division: 4,
    beatsPerMeasure: 4,
    subdivisionsPerBeat: 1,
    activePreset: 'moderato'
};

// Inicialização
function init() {
    setupEventListeners();
    setupKeyboardShortcuts();
    applyDefaultConfig();
    updateMeasureIndicators();
    // Inicializa visibilidade dos botões
    elements.startBtn.style.display = '';
    elements.stopBtn.style.display = 'none';
}

// Configuração padrão
function applyDefaultConfig() {
    state.bpm = defaultConfig.bpm;
    state.division = defaultConfig.division;
    state.beatsPerMeasure = defaultConfig.beatsPerMeasure;
    
    elements.bpmSlider.value = state.bpm;
    elements.bpmDisplay.textContent = state.bpm;
    
    // Ativar botões padrão
    elements.rhythmButtons.forEach(btn => {
        if (parseInt(btn.dataset.division) === state.division) {
            btn.classList.add('active');
        }
    });
    
    elements.timeButtons.forEach(btn => {
        if (btn.dataset.beats && parseInt(btn.dataset.beats) === state.beatsPerMeasure) {
            btn.classList.add('active');
        }
        if (btn.dataset.subdivision && parseInt(btn.dataset.subdivision) === state.subdivisionsPerBeat) {
            btn.classList.add('active');
        }
    });
    
    elements.presetButtons.forEach(btn => {
        if (parseInt(btn.dataset.bpm) === state.bpm) {
            btn.classList.add('active');
        }
    });
}


// Event Listeners
function setupEventListeners() {
    elements.bpmSlider.addEventListener('input', updateBPM);
    
    elements.rhythmButtons.forEach(btn => {
        btn.addEventListener('click', () => handleRhythmChange(btn));
    });
    
    elements.timeButtons.forEach(btn => {
        btn.addEventListener('click', () => handleTimeChange(btn));
    });
    
    elements.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => handlePresetChange(btn));
    });
    
    elements.startBtn.addEventListener('click', startMetronome);
    elements.stopBtn.addEventListener('click', stopMetronome);
    elements.resetBtn.addEventListener('click', resetMetronome);
    elements.themeToggle.addEventListener('click', toggleTheme);
    window.addEventListener('resize', updateMeasureIndicators);
}

// Atualizar BPM
function updateBPM() {
    state.bpm = parseInt(elements.bpmSlider.value);
    elements.bpmDisplay.textContent = state.bpm;
    updateActivePreset();
}

// Mudança de figura rítmica
function handleRhythmChange(button) {
    elements.rhythmButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    state.division = parseInt(button.dataset.division);
    restartIfPlaying();
}

// Mudança de compasso/subdivisões
function handleTimeChange(button) {
    if (button.dataset.beats) {
        document.querySelectorAll('.time-btn[data-beats]').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        state.beatsPerMeasure = parseInt(button.dataset.beats);
    } 
    updateMeasureIndicators();
    restartIfPlaying();
}

// Mudança de preset
function handlePresetChange(button) {
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    elements.bpmSlider.value = button.dataset.bpm;
    updateBPM();
    restartIfPlaying();
}

// Atualizar preset ativo
function updateActivePreset() {
    elements.presetButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.bpm) === state.bpm);
    });
}

// Reiniciar se estiver tocando
function restartIfPlaying() {
    if (state.isPlaying) {
        stopMetronome();
        startMetronome();
    }
}

// Atualizar indicadores de compasso
function updateMeasureIndicators() {
    elements.measuresContainer.innerHTML = '';
    const containerWidth = elements.measuresContainer.clientWidth;
    const measureWidth = 100;
    const maxMeasures = Math.max(state.beatsPerMeasure, Math.floor(containerWidth / measureWidth));
    
    for (let m = 0; m < maxMeasures; m++) {
        const measure = createMeasureElement(m);
        elements.measuresContainer.appendChild(measure);
    }
}

// Criar elemento de compasso
function createMeasureElement(index) {
    const measure = document.createElement('div');
    measure.className = 'measure';
    if (index === 0) measure.classList.add('strong');
    
    const measureNumber = document.createElement('div');
    measureNumber.className = 'measure-number';
    measureNumber.textContent = index + 1;
    measure.appendChild(measureNumber);
    
    const subdivisionContainer = document.createElement('div');
    subdivisionContainer.className = 'subdivision-container';
    
    const totalSubdivisions = state.beatsPerMeasure * state.subdivisionsPerBeat;
    for (let i = 0; i < totalSubdivisions; i++) {
        const subBeat = document.createElement('div');
        subBeat.className = 'sub-beat';
        subdivisionContainer.appendChild(subBeat);
    }
    
    measure.appendChild(subdivisionContainer);
    return measure;
}

// Tocar som
function playSound(frequency, duration, type = 'sine') {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Tocar batida
function playBeat() {
    const totalSubdivisions = state.beatsPerMeasure * state.subdivisionsPerBeat;
    const measures = document.querySelectorAll('.measure');
    const maxMeasures = measures.length;
    const globalSubdivision = (state.currentMeasure * totalSubdivisions) + 
                             (state.currentBeat * state.subdivisionsPerBeat) + 
                             state.currentSubdivision;
    
    // Atualizar visuais
    updateVisualIndicators(measures, globalSubdivision, totalSubdivisions, maxMeasures);
    
    // Tocar som
    playBeatSound();
    
    // Avançar para próxima subdivisão
    advanceBeat(totalSubdivisions, maxMeasures);
}

// Atualizar indicadores visuais
function updateVisualIndicators(measures, globalSubdivision, totalSubdivisions, maxMeasures) {
    const subBeats = document.querySelectorAll('.sub-beat');
    
    measures.forEach(measure => measure.classList.remove('active'));
    subBeats.forEach(sub => sub.classList.remove('active'));
    
    const currentMeasureIndex = state.currentMeasure % maxMeasures;
    if (measures[currentMeasureIndex]) {
        measures[currentMeasureIndex].classList.add('active');
    }
    
    const totalVisibleSubdivisions = maxMeasures * totalSubdivisions;
    if (subBeats[globalSubdivision % totalVisibleSubdivisions]) {
        subBeats[globalSubdivision % totalVisibleSubdivisions].classList.add('active');
    }
    
    elements.pulse.classList.add('active');
    setTimeout(() => elements.pulse.classList.remove('active'), 100);
}

// Tocar som da batida
function playBeatSound() {
    if (state.currentSubdivision === 0) {
        if (state.currentBeat === 0) {
            playSound(1000, 0.15, 'square'); // Tempo forte
        } else {
            playSound(800, 0.1, 'sine'); // Outros tempos
        }
    } else {
        playSound(600, 0.05, 'sine'); // Subdivisões
    }
}

// Avançar batida
function advanceBeat(totalSubdivisions, maxMeasures) {
    state.currentSubdivision++;
    
    if (state.currentSubdivision >= state.subdivisionsPerBeat) {
        state.currentSubdivision = 0;
        state.currentBeat++;
        
        if (state.currentBeat >= state.beatsPerMeasure) {
            state.currentBeat = 0;
            state.currentMeasure = (state.currentMeasure + 1) % maxMeasures;
        }
    }
}

// Iniciar metrônomo
function startMetronome() {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    elements.startBtn.style.display = 'none';
    elements.stopBtn.style.display = '';
    
    const interval = (60 / state.bpm) * (4 / state.division) * (1 / state.subdivisionsPerBeat) * 1000;
    
    state.currentMeasure = 0;
    state.currentBeat = 0;
    state.currentSubdivision = 0;
    
    playBeat();
    state.timerId = setInterval(playBeat, interval);
}

// Parar metrônomo
function stopMetronome() {
    if (!state.isPlaying) return;
    
    state.isPlaying = false;
    elements.startBtn.style.display = '';
    elements.stopBtn.style.display = 'none';
    
    clearInterval(state.timerId);
    resetVisualIndicators();
}


// Resetar metrônomo
function resetMetronome() {
    stopMetronome();
    
    // REMOVER classes active de TODOS os botões
    elements.rhythmButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.time-btn[data-beats]').forEach(btn => btn.classList.remove('active'));
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));
    
    applyDefaultConfig();
    updateMeasureIndicators();
    
    // CORREÇÃO: Garantir que os botões voltem ao estado inicial
    elements.startBtn.style.display = '';
    elements.stopBtn.style.display = 'none';
}

// Resetar indicadores visuais
function resetVisualIndicators() {
    const measures = document.querySelectorAll('.measure');
    const subBeats = document.querySelectorAll('.sub-beat');
    
    measures.forEach(measure => measure.classList.remove('active'));
    subBeats.forEach(sub => sub.classList.remove('active'));
    
    if (measures[0]) {
        measures[0].classList.add('active');
        const firstSubs = measures[0].querySelectorAll('.sub-beat');
        if (firstSubs[0]) firstSubs[0].classList.add('active');
    }
    
    state.currentMeasure = 0;
    state.currentBeat = 0;
    state.currentSubdivision = 0;
}

// Teclas de atalho
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignorar se estiver em campo de input
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (state.isPlaying) {
                    stopMetronome();
                } else {
                    startMetronome();
                }
                break;
                
            case 'KeyR':
                if (!state.isPlaying) {
                    e.preventDefault();
                    resetMetronome();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                stopMetronome();
                break;
        }
    });
}

// E adicionar na função init():
function init() {
    setupEventListeners();
    setupKeyboardShortcuts(); // ← ADICIONAR ESTA LINHA
    applyDefaultConfig();
    updateMeasureIndicators();
}

// Alternar temas
function toggleTheme() {
    const themes = ['default', 'dark', 'blue', 'green', 'purple'];
    const themeIcons = ['🌙', '☀️', '🔵', '🟢', '🟣'];
    
    const currentIndex = themes.indexOf(state.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    state.currentTheme = themes[nextIndex];
    
    document.body.className = state.currentTheme !== 'default' ? `theme-${state.currentTheme}` : '';
    elements.themeToggle.innerHTML = `<span>${themeIcons[nextIndex]}</span> Tema`;
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
