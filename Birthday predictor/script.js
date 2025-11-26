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

// DOM elements
const questionEl = document.getElementById('question');
const counterEl = document.getElementById('counter');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const voiceBtn = document.getElementById('voiceBtn');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');

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
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
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
