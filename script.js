// Generate all dates from Jan 1 to Dec 31
const dates = [];
const startDate = new Date(2024, 0, 1); // Jan 1, 2024
for (let i = 0; i < 366; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
}

// Game state
let low = 0;
let high = dates.length - 1;
let mid = Math.floor((low + high) / 2);
let finished = false;
let queryCount = 0;
let isListening = false;
let voicesReady = false;

// DOM elements
const questionEl = document.getElementById('question');
const counterEl = document.getElementById('counter');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const voiceBtn = document.getElementById('voiceBtn');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const voiceSelect = document.getElementById('voiceSelect');
const previewVoiceBtn = document.getElementById('previewVoice');

// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = SpeechRecognition ? new SpeechRecognition() : null;

if (recognizer) {
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = 'en-US';

    recognizer.onstart = () => {
        statusEl.textContent = 'Listening...';
        isListening = true;
    };

    recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        statusEl.textContent = `You said: ${transcript}`;
        processAnswer(transcript);
    };

    recognizer.onerror = (event) => {
        statusEl.textContent = `Error: ${event.error}`;
        isListening = false;
    };

    recognizer.onend = () => {
        isListening = false;
    };
}

// Format date as "Month DD"
function formatDate(d) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[d.getMonth()];
    const day = d.getDate();
    return `${month} ${day}`;
}

// Speak text using Web Speech API
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    // prefer a sweeter, female-sounding voice when available
    if (selectedVoice) utterance.voice = selectedVoice;
    // slightly higher pitch and a gentle pace
    utterance.pitch = 1.2;
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
}

// Select a preferred voice (female-like) from available voices
let selectedVoice = null;
function choosePreferredVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // If user previously selected a voice, prefer that
    const saved = localStorage.getItem('preferredVoiceName');
    if (saved) {
        const foundSaved = voices.find(v => v.name === saved || v.voiceURI === saved);
        if (foundSaved) { selectedVoice = foundSaved; return; }
    }

    // Prefer Indian English voices first (en-IN) or voice names containing 'india'/'indian'
    // Then prefer common female voice names as a fallback
    const preferredIndianTokens = ['india', 'indian', 'en-in', 'hi-in', 'hindi'];
    for (const v of voices) {
        const lname = (v.lang || '').toLowerCase();
        const n = (v.name || '').toLowerCase();
        if (preferredIndianTokens.some(t => lname.includes(t) || n.includes(t))) {
            selectedVoice = v; return;
        }
    }

    // fallback female-preference order
    const preferredNames = [
        'samantha', 'zira', 'karen', 'allison', 'google', 'female'
    ];
    for (const p of preferredNames) {
        const found = voices.find(v => v.name && v.name.toLowerCase().includes(p));
        if (found) { selectedVoice = found; return; }
    }

    // otherwise pick a voice with English lang, prefer en-GB/en-US, then any
    const enIn = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en-in'));
    if (enIn) { selectedVoice = enIn; return; }
    const en = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    selectedVoice = en || voices[0];
}

function populateVoiceList() {
    const voices = speechSynthesis.getVoices() || [];
    if (!voiceSelect) return;
    // clear
    voiceSelect.innerHTML = '';
    const saved = localStorage.getItem('preferredVoiceName');
    voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name || v.voiceURI || `${v.lang}-${v.name}`;
        opt.textContent = `${v.name} — ${v.lang}`;
        if (saved && (v.name === saved || v.voiceURI === saved)) opt.selected = true;
        voiceSelect.appendChild(opt);
    });
}

// When user selects a voice from the dropdown
if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
        const voices = speechSynthesis.getVoices() || [];
        const sel = voiceSelect.value;
        const found = voices.find(v => v.name === sel || v.voiceURI === sel);
        if (found) {
            selectedVoice = found;
            localStorage.setItem('preferredVoiceName', found.name || found.voiceURI);
        }
    });
}

if (previewVoiceBtn) {
    previewVoiceBtn.addEventListener('click', () => {
        speak('Hello! This is a preview of the selected voice.');
    });
}

// voices may load asynchronously
if (typeof speechSynthesis !== 'undefined') {
    populateVoiceList();
    choosePreferredVoice();
    voicesReady = true; // mark ready after initial load
    speechSynthesis.onvoiceschanged = () => { 
        populateVoiceList(); 
        choosePreferredVoice(); 
        voicesReady = true;
    };
}

// Parse date from spoken text (e.g., "26 october" or "26 oct")
function parseDateFromText(text) {
    if (!text) return null;

    // Find day number
    const dayMatch = text.match(/\b(\d{1,2})\b/);
    const day = dayMatch ? parseInt(dayMatch[1]) : null;

    // Month names and abbreviations
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthAbbr = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];

    let month = null;
    for (let i = 0; i < monthNames.length; i++) {
        if (text.includes(monthNames[i])) {
            month = i;
            break;
        }
    }

    if (month === null) {
        for (let i = 0; i < monthAbbr.length; i++) {
            if (text.includes(monthAbbr[i])) {
                month = i;
                break;
            }
        }
    }

    if (day && month !== null) {
        for (let i = 0; i < dates.length; i++) {
            if (dates[i].getDate() === day && dates[i].getMonth() === month) {
                return i;
            }
        }
    }

    return null;
}

// Ask the current binary search question
function askQuestion() {
    mid = Math.floor((low + high) / 2);
    queryCount++;
    counterEl.textContent = `Attempts: ${queryCount}`;

    const currentDate = dates[mid];
    const q = `Is your birthday on or before ${formatDate(currentDate)}? Say yes or no.`;
    questionEl.textContent = q;
    speak(q);
}

// Process the answer (yes/no or direct date)
function processAnswer(ansText) {
    if (finished) return;

    // Try to parse direct date input
    const dateIdx = parseDateFromText(ansText);
    if (dateIdx !== null) {
        const birthday = dates[dateIdx];
        const msg = `Your birthday is ${formatDate(birthday)}!`;
        questionEl.textContent = msg;
        statusEl.textContent = '';
        speak(msg);
        finished = true;
        return;
    }

    // Check for yes/no variants
    if (['yes', 'yeah', 'yep', 'y'].some(w => ansText.includes(w))) {
        high = mid;
    } else if (['no', 'nah', 'nope', 'n'].some(w => ansText.includes(w))) {
        low = mid + 1;
    } else {
        speak('Please say yes or no, or speak your date like 26 October.');
        return;
    }

    // Check if we've narrowed down to one date
    if (low === high) {
        const birthday = dates[low];
        const msg = `Your birthday is ${formatDate(birthday)}! (Attempts: ${queryCount})`;
        questionEl.textContent = msg;
        statusEl.textContent = '';
        speak(msg);
        finished = true;
        return;
    }

    // Continue asking
    askQuestion();
}

// Start a new game
function startGame() {
    // If voices not yet loaded, wait a bit and try again
    if (!voicesReady) {
        statusEl.textContent = 'Loading voices... please wait.';
        setTimeout(startGame, 500);
        return;
    }

    low = 0;
    high = dates.length - 1;
    mid = Math.floor((low + high) / 2);
    finished = false;
    queryCount = 0;
    counterEl.textContent = 'Attempts: 0';
    statusEl.textContent = '';
    askQuestion();
}

// Event listeners
startBtn.addEventListener('click', startGame);

voiceBtn.addEventListener('click', () => {
    if (!recognizer) {
        statusEl.textContent = 'Speech recognition not supported in your browser.';
        return;
    }
    recognizer.start();
});

yesBtn.addEventListener('click', () => {
    processAnswer('yes');
});

noBtn.addEventListener('click', () => {
    processAnswer('no');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'y') processAnswer('yes');
    if (e.key.toLowerCase() === 'n') processAnswer('no');
});

// Fallback: if speech recognition not available, show message
if (!recognizer) {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Speech recognition not supported in your browser';
}
