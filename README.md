# Voice Birthday Predictor

A fun app that guesses your birthday using binary search and voice interaction!

## Two Versions Available

### Web Version (Recommended for GitHub Pages)
Hosted at: `https://yourusername.github.io/birthday-predictor/`

**Files:**
- `index.html` – Main app interface
- `style.css` – Styling
- `script.js` – Binary search logic + voice recognition

**Features:**
- ✅ Browser-based (works on desktop & mobile)
- ✅ Free hosting on GitHub Pages
- ✅ Voice recognition using Web Speech API
- ✅ Text-to-speech for questions
- ✅ Yes/No buttons as fallback
- ✅ Keyboard shortcuts (Y/N keys)

**How to run locally:**
1. Open `index.html` in your browser (or use a local server)
2. Click "Start" and answer Yes/No questions
3. Say your birthday directly (e.g., "26 October") to skip ahead

**How to deploy to GitHub Pages:**
1. Create a GitHub repo called `birthday-predictor`
2. Push all files to the `main` branch
3. Go to repo **Settings** → **Pages** → select `main` branch as source
4. Your app will be live at `https://yourusername.github.io/birthday-predictor/`

---

### Desktop Version (Python)
Requires Python 3.10+

**Files:**
- `app.py` – Tkinter desktop app
- `requirements.txt` – Dependencies

**Quick start (Windows PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**Note:** PyAudio may require a prebuilt wheel on Windows. See [LFD wheels](https://www.lfd.uci.edu/~gohlke/pythonlibs/) if installation fails.

---

## Features

- 🎯 **Binary Search:** Finds your birthday in ~9 questions (out of 366 days)
- 🎤 **Voice Input:** Speak Yes/No or your birthday directly
- 🔘 **Fallback Buttons:** Use Yes/No buttons if voice isn't working
- 📊 **Attempt Counter:** Shows how many questions were asked
- ⌨️ **Keyboard Shortcuts:** Press Y or N for quick answers
