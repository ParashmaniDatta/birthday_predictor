# Dependencies: install with `pip install -r requirements.txt`
import tkinter as tk
import speech_recognition as sr
import pyttsx3
from datetime import date, timedelta
import re
import calendar

# ---------------- Voice Engine ----------------
engine = pyttsx3.init()

def speak(text):
    engine.say(text)
    engine.runAndWait()

recognizer = sr.Recognizer()

def listen():
    with sr.Microphone() as source:
        status_label.config(text="Listening...")
        # adjust for ambient noise and limit listen time so it doesn't hang
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)

    try:
        text = recognizer.recognize_google(audio).lower()
        status_label.config(text=f"You said: {text}")
        return text
    except sr.UnknownValueError:
        status_label.config(text="Didn't catch that.")
        return ""
    except sr.RequestError:
        status_label.config(text="Speech service unavailable.")
        return ""

# ---------------- Date List -------------------
# Create all dates from Jan 1 to Dec 31 (non-leap year)
start = date(2024, 1, 1)
dates = [start + timedelta(days=i) for i in range(366)]

low = 0
high = len(dates) - 1
mid = (low + high) // 2
finished = False
# count how many questions (predictions) we've asked
query_count = 0

def format_date(d):
    return d.strftime("%B %d")

# ---------------- Question Logic --------------
def ask_question():
    global mid, query_count
    # recalc mid each time so it stays consistent with low/high
    mid = (low + high) // 2
    # increment question counter and update UI
    query_count += 1
    try:
        counter_label.config(text=f"Attempts: {query_count}")
    except NameError:
        pass

    current_date = dates[mid]
    q = f"Is your birthday on or before {format_date(current_date)}? Say yes or no."
    question_label.config(text=q)
    speak(q)

def parse_date_from_text(text):
    # Try to extract day and month from spoken text like '26 october' or '26 oct'
    # Return index in dates list if found, else None
    if not text:
        return None
    # find day
    m_day = re.search(r"\b(\d{1,2})\b", text)
    day = int(m_day.group(1)) if m_day else None
    # find month name
    month = None
    for name in list(calendar.month_name)[1:]:
        if name and name.lower() in text:
            month = list(calendar.month_name).index(name)
            break
    if not month:
        for abbr in list(calendar.month_abbr)[1:]:
            if abbr and abbr.lower() in text:
                month = list(calendar.month_abbr).index(abbr)
                break
    if day and month:
        # find matching date index
        for i, d in enumerate(dates):
            if d.day == day and d.month == month:
                return i
    return None


def process_answer_text(ans_text):
    global low, high, mid, finished

    if finished:
        return

    # allow direct date input if spoken
    idx = parse_date_from_text(ans_text)
    if idx is not None:
        birthday = dates[idx]
        msg = f"Your birthday is {format_date(birthday)}!"
        question_label.config(text=msg)
        speak(msg)
        finished = True
        return

    # interpret yes/no variants
    if any(w in ans_text for w in ("yes", "yeah", "yep", "y")):
        # birthday is on or before mid
        high = mid
    elif any(w in ans_text for w in ("no", "nah", "nope", "n")):
        # birthday is after mid
        low = mid + 1
    else:
        speak("Please say yes or no, or speak your date like 26 October.")
        return

    if low == high:
        birthday = dates[low]
        msg = f"Your birthday is {format_date(birthday)}! (Attempts: {query_count})"
        question_label.config(text=msg)
        speak(msg)
        finished = True
        return

    # continue searching
    ask_question()


def handle_response():
    text = listen()
    process_answer_text(text)

# ---------------- GUI Setup -------------------
root = tk.Tk()
root.title("Voice Birthday Predictor (Month + Day)")
root.geometry("600x300")

title = tk.Label(root, text="Voice Interactive Birthday Predictor", font=("Arial", 20))
title.pack(pady=10)

question_label = tk.Label(root, text="Click Start to begin", font=("Arial", 15))
question_label.pack(pady=20)

def start_game():
    global low, high, mid, finished, query_count
    low = 0
    high = len(dates) - 1
    mid = (low + high) // 2
    finished = False
    # reset counter
    query_count = 0
    try:
        counter_label.config(text=f"Attempts: {query_count}")
    except NameError:
        pass
    ask_question()


start_button = tk.Button(root, text="Start", font=("Arial", 14), command=start_game)
start_button.pack()

listen_button = tk.Button(root, text="Answer (Voice)", font=("Arial", 14), command=handle_response)
listen_button.pack(pady=10)

# Add Yes/No buttons as reliable fallbacks
yes_button = tk.Button(root, text="Yes", font=("Arial", 12), width=8, command=lambda: process_answer_text("yes"))
yes_button.pack(side="left", padx=30, pady=10)

no_button = tk.Button(root, text="No", font=("Arial", 12), width=8, command=lambda: process_answer_text("no"))
no_button.pack(side="right", padx=30, pady=10)

# keyboard shortcuts for yes/no
root.bind('<y>', lambda e: process_answer_text("yes"))
root.bind('<n>', lambda e: process_answer_text("no"))

# counter label (shows attempts) placed near the bottom
counter_label = tk.Label(root, text="Attempts: 0", font=("Arial", 12))
counter_label.pack(pady=5)

status_label = tk.Label(root, text="", font=("Arial", 12), fg="blue")
status_label.pack()

root.mainloop()
