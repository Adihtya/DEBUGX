# DEBUGX — Android APK Build & Deployment Guide

> **Product:** DebugX  
> **Tagline:** *Find the Bug. Understand the Cause. Fix with Confidence.*  
> **Tech Stack:** Kotlin, Jetpack Compose, Material 3, Google Gemini API, Android SDK 34 (UpsideDownCake)

---

## 📱 1. Architecture Overview

DebugX is built as a complete dual-architecture solution:

1. **Native Android Project (`android/`):**
   - 100% Kotlin & Jetpack Compose
   - Material 3 Design System (#090B10, #10141D, #151A26, #8B5CF6, #38BDF8)
   - Official Google Gemini AI Android SDK (`com.google.ai.client.generativeai:generativeai:0.9.0`)
   - Navigation Compose (Home, Debug Workspace, Results, Follow-up Chat, History, Learning Centre, Profile)
   - ViewModel + StateFlow + Coroutines architecture
   - Production Gradle setup (`gradlew assembleDebug` / `gradlew assembleRelease`)

2. **Interactive Responsive Mobile Engine (`public/`):**
   - Live mobile device preview (Pixel 8 container + full-width view)
   - Zero-dependency Node.js runtime (`npm start` -> `http://localhost:3000`)
   - Gemini Multimodal API integration + offline senior-engineer fallback
   - Section 18 sample demonstration and interactive quizzes

---

## 🚀 2. How to Build the Native Android APK

### Prerequisites:
- **JDK 17 or 21** installed (`java -version`)
- **Android SDK** (API level 34, Android Build Tools 34.0.0) or **Android Studio Hedgehog / Jellyfish / Ladybug**

### Method A: Build via Command Line (Fastest)

1. Open your terminal and navigate to the `android/` directory:
   ```bash
   cd android
   ```

2. Make sure the Gradle wrapper has execution permissions (already set):
   ```bash
   chmod +x gradlew
   ```

3. Run the Gradle build command to generate the debug APK:
   ```bash
   ./gradlew assembleDebug
   ```
   *(On Windows Command Prompt or PowerShell, run: `gradlew.bat assembleDebug`)*

4. Your compiled APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

### Method B: Build using Android Studio

1. Launch **Android Studio**.
2. Select **Open** and choose the `android` folder located inside `/Users/adityachaudhari/Downloads/DEBUGX/android`.
3. Android Studio will automatically perform a Gradle Sync.
4. From the top menu, select:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
5. Once complete, click the notification popup **locate** to view `app-debug.apk`.

---

## 📲 3. How to Install the APK on Your Android Device

### Option 1: Direct USB / Wireless ADB
Connect your Android phone with **USB Debugging** enabled, then run:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Direct File Transfer
Copy `app-debug.apk` to your phone via Google Drive, WhatsApp, Telegram, or USB, and tap the APK file in your phone's File Manager to install.

---

## 🔑 4. Configuring Google Gemini API Key

In the app:
1. Open the **Profile** tab (bottom navigation).
2. Enter your Google Gemini API Key in the **Google Gemini API Key** field.
3. Tap **Save Key**.
4. The app uses `gemini-1.5-flash` for multimodal code & screenshot reasoning.
5. If no API key is entered, DebugX automatically uses its built-in senior engineer intelligent reasoning engine and Section 18 sample demonstrator!

---

## 🌐 5. Running the Responsive Web Preview

The web preview is currently running live on:
```
http://localhost:3000
```

To restart or run manually:
```bash
npm start
```
or
```bash
node server.js
```

---

## 🧪 6. Verification Checklist

- [x] **Home Screen**: Header, Greeting, Metrics widgets, Quick Actions, Tip of the Day, Recent Activity.
- [x] **Workspace Screen**: Screenshot drag & drop, Code editor with line numbers, 15+ language selectors, Beginner vs Advanced toggle.
- [x] **Sample Demonstration**: Section 18 Python `IndexError` example preloaded and verified.
- [x] **Results Screen**: Structured Section 14 JSON output, Error overview, Problematic code highlighting, Verified fix with copy button, Step-by-step why fix works, Prevention tips, Related concepts.
- [x] **Contextual Chat**: Follow-up chat retaining error context with quick prompts.
- [x] **History**: Persistent storage, search, filter by language, delete, reload past sessions.
- [x] **Learning Centre**: Common error library (Python, Kotlin, Java, JS, C++), interactive bug challenges, practice quiz.
- [x] **Profile & Settings**: Gemini API Key configuration, dark theme styling, export history to JSON.
