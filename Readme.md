<div align="center">

# <span style="color:#A78BFA;">DEBUG</span><span style="color:#38BDF8;">X</span>

### AI-POWERED DEBUGGING & CODE INTELLIGENCE

**Find the Bug. Understand the Cause. Fix with Confidence.**

[![AI - Google Gemini & Firebase AI Logic](https://img.shields.io/badge/AI-Firebase%20AI%20Logic%20%7C%20Gemini-8B5CF6?style=for-the-badge&logo=google-gemini&logoColor=white)](https://firebase.google.com/)
[![Auth - Firebase Google Sign--In](https://img.shields.io/badge/Auth-Firebase%20%2B%20Google-FFA611?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Database - Cloud Firestore](https://img.shields.io/badge/Database-Cloud%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Platform - Android & Web](https://img.shields.io/badge/Platform-Android%20%7C%20Web-38BDF8?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX)
[![Release - v1.3.0](https://img.shields.io/badge/Release-v1.3.0%20APK-22C55E?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX/releases/latest)
[![Kotlin - Jetpack Compose](https://img.shields.io/badge/Android-Jetpack%20Compose-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://developer.android.com/jetpack/compose)

<br/>

[📱 **Download Android APK (v1.3.0)**](https://github.com/Adihtya/DEBUGX/releases/download/v1.3.0/app-debug.apk) &nbsp; • &nbsp;
[🌐 **Live Web App**](#-quick-start) &nbsp; • &nbsp;
[✨ **Features**](#-features) &nbsp; • &nbsp;
[🔐 **Auth & AI Architecture**](#-authentication--automatic-gemini-connection) &nbsp; • &nbsp;
[🧠 **Explain My Code**](#-feature-spotlight-explain-my-code) &nbsp; • &nbsp;
[🚀 **Installation**](#-installation--build)

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:090B10,50:241747,100:090B10&height=3" width="100%" />

</div>

## 01. About DEBUGX

**DEBUGX** is an AI-powered code analysis and debugging assistant crafted for developers, students, and engineers. It doesn't just hand you a patch—it demystifies what went wrong, explains the execution mechanics, and guides you to write resilient, clean code.

> **"Don't just fix the bug. Understand it."**

Whether you are debugging compiler errors on your laptop screen via your smartphone camera, pasting broken algorithms into the interactive web workbench, or stepping through loop iterations line-by-line, DebugX provides the clarity you need.

With **v1.3.0**, DebugX features enterprise-grade **Google Sign-In with Firebase Authentication**, **Cloud Firestore profile & history sync**, and **Automatic Gemini Connection via Firebase AI Logic**—delivering zero-friction AI intelligence with **no manual API keys required from users**.

---

## 02. Features

<table>
<tr>
<td width="50%" valign="top">

### 🔐 Google Auth & Automatic AI *(v1.3.0)*
- **One-Tap Google Authentication**: Credential Manager for native Android & Firebase Auth Google Provider for Web.
- **Zero Manual API Keys**: Automatic Gemini connection initialized via Firebase project configuration.
- **Cloud Firestore Synchronization**: Cloud-synced user profiles (`users/{uid}`) and debugging history sessions.
- **Production-Grade Security Rules**: Strict client data isolation and DoS mitigation for Firestore and Cloud Storage.
- **Live AI Engine Status**: Real-time connection badge with latency diagnostics and automatic retry.

</td>
<td width="50%" valign="top">

### 🧠 Explain My Code *(v1.2.0)*
- **Interactive Line-by-Line Breakdown**: Click any code line to inspect its purpose and runtime role.
- **Variable Tracking & Scopes**: Automatic detection of data types, scopes, declarations, and usages.
- **Loop & Function Visualizers**: Step-by-step iteration state table and call stack frame hierarchy.
- **Complexity Analysis**: Big-O time and space complexity with clear mathematical rationale.
- **Honest AI Output Prediction**: Clear demarcation between statically deduced output and sandbox runtime.
- **Dual Explanation Modes**: *Beginner Mode* (plain English & analogies) or *Advanced Mode* (AST, memory & performance).

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📸 Live Camera & Snap-to-Debug *(v1.1.0)*
- **Hardware CameraX Integration**: Native Android camera viewfinder with front/rear lens toggle.
- **Physical Screen Capture**: Snap code and stack traces directly off laptop monitors or terminal screens.
- **Web Browser Camera**: HTML5 `getUserMedia` camera preview with instant retake and capture controls.
- **Multimodal Gemini Vision**: Simultaneous OCR, syntax parsing, and error extraction.
- **Hybrid Input**: Combine captured camera photos with pasted code for complete context.

</td>
<td width="50%" valign="top">

### 🐛 AI Code Debugger
- **Deep Root Cause Diagnosis**: Pinpoint syntax, logical, and runtime bugs.
- **Ready-to-Use Code Patches**: Side-by-side original vs. corrected code diffs.
- **Actionable Explanations**: Clear bullet points explaining why the error occurred.
- **Multi-language Support**: Python, JavaScript, Java, C++, Kotlin, Go, Rust, TypeScript, and more.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 💬 Interactive AI Follow-up Chat
- **Context-Aware Dialogue**: Ask questions directly referencing the analyzed code.
- **Alternative Approaches**: Request alternate algorithms or optimized patterns.
- **Concept Deep-Dives**: Ask about language idioms, memory safety, or edge cases.

</td>
<td width="50%" valign="top">

### 📚 Learning Centre & History
- **Categorized Error Knowledge Base**: Common pitfalls across JavaScript, Python, C++, and Java.
- **Interactive Bug Challenges**: Real-world buggy snippets to test your diagnostic skills.
- **Practice Quizzes**: Instant feedback on debugging logic and compiler mechanics.
- **Multi-tier Persistence**: Seamless offline caching with cloud Firestore sync for logged-in accounts.

</td>
</tr>
</table>

---

## 03. Authentication & Automatic Gemini Connection

DebugX v1.3.0 implements a frictionless user onboarding experience powered by **Firebase Authentication** and **Firebase AI Logic**:

```
┌─────────────────────────────────┐
│     Welcome Screen (DebugX)     │
│   "Find the Bug. Understand..." │
└────────────────┬────────────────┘
                 │
                 ▼  [Continue with Google]
┌─────────────────────────────────┐
│     Google Sign-In Dialog       │
│   (Credential Manager / OAuth)  │
└────────────────┬────────────────┘
                 │
                 ▼  [Firebase Auth Success]
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│    Cloud Firestore Sync         │      │    Firebase AI Logic Init       │
│    Create/Update users/{uid}    │◄────►│    Connects Gemini 1.5 Flash    │
│    Sync debugging sessions      │      │    Verified AI Engine: Online   │
└────────────────┬────────────────┘      └────────────────┬────────────────┘
                 │                                        │
                 └───────────────────┬────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │       DebugX Dashboard        │
                     │  Ready for Instant Debugging  │
                     └───────────────────────────────┘
```

### Key Architectural Highlights:
1. **Zero User-Facing API Keys**: Users are never asked to generate, paste, or configure Gemini API keys. Access is governed securely through Firebase backend configuration.
2. **Modular AI Service Layer**:
   - `GeminiService`: Coordinates model lifecycle and request execution.
   - `ScreenshotAnalyzer`: Processes camera captures and screenshots multimodally.
   - `CodeAnalyzer`: Analyzes syntax trees, logical flows, and compiler traces.
   - `ErrorExplainer`: Generates tailored beginner or advanced breakdowns.
   - `CodeCorrectionService`: Produces formatted code diffs and remedial steps.
   - `AIChatService`: Manages conversational session history.
   - `DebuggingRepository`: Bridges local storage with Cloud Firestore.
3. **Hardened Security Rules**:
   - `firestore.rules`: Strict user data isolation (`request.auth.uid == uid`), length constraints, and schema validation.
   - `storage.rules`: Isolated user screenshot buckets with MIME type enforcement and size limits (<10MB).

---

## 04. Feature Spotlight: Explain My Code

DebugX includes **Explain My Code**—an interactive code intelligence engine designed to make complex algorithms crystal clear.

```
┌─────────────────────────────────┬─────────────────────────────────┐
│     Interactive Code Editor     │    Synchronized Explanation     │
│                                 │                                 │
│  1  def binary_search(arr, x):  │  Line 1: Function Definition   │
│  2      low = 0                 │  Initializes search boundary.   │
│  3      high = len(arr) - 1     │                                 │
│  4      while low <= high:  ───►│  Selected: While Loop           │
│  5          mid = (low+high)//2 │  Repeats while search space > 0 │
└─────────────────────────────────┴─────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────┐
│                      Execution & Visualizers                      │
│  [Variables]  low (int), high (int), mid (int)                    │
│  [Loop Trace] Iteration 1: low=0, high=5, mid=2, arr[mid]=7      │
│  [Complexity] Time: O(log n)  |  Space: O(1)                      │
│  [Prediction] Statically deduced: returns index 3                 │
└───────────────────────────────────────────────────────────────────┘
```

---

## 05. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Android Application** | Kotlin, Jetpack Compose, Material 3, CameraX, Credential Manager, StateFlow, ViewModel |
| **Web Application** | HTML5, CSS3 (Theme `#090909`), JavaScript (ES2022 Modular), Express.js (Node.js) |
| **Authentication** | Firebase Authentication (Google Sign-In Provider & Android Credential Manager) |
| **Database & Storage** | Cloud Firestore, Firebase Cloud Storage, IndexedDB / LocalStorage fallback |
| **Artificial Intelligence** | Firebase AI Logic, Google Gemini 1.5 Flash, Multimodal Vision API |
| **Security & Governance** | Firestore Security Rules, Cloud Storage Security Rules, Firebase App Check readiness |
| **CI / CD Automation** | GitHub Actions, Automated Gradle assembleDebug pipeline, GitHub Releases |

---

## 06. Quick Start

### 📱 Android Application (Direct APK Install)

1. Download the latest debug APK from the releases page:
   **[Download DebugX v1.3.0 APK](https://github.com/Adihtya/DEBUGX/releases/download/v1.3.0/app-debug.apk)**
2. On your Android device, allow installation from unknown sources if prompted.
3. Open DebugX, tap **Continue with Google**, and start debugging!

---

### 🌐 Web Prototype (Local Server)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Adihtya/DEBUGX.git
   cd DEBUGX
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the web server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

### 🛠️ Building Android APK from Source

```bash
cd android
chmod +x gradlew
./gradlew :app:assembleDebug --stacktrace
```

The compiled APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 07. Project Roadmap

- [x] **v1.0.0**: Core AI Code Debugger, Error Classification, Fix Generator, Learning Centre, Offline History
- [x] **v1.1.0**: Live Camera Capture (CameraX on Android, `getUserMedia` on Web), Screen Error Scanning, Image Upload
- [x] **v1.2.0**: Feature 3: Explain My Code (Line-by-line sync, Loop/Function visualizers, Variable tracking, Complexity analysis, Ask AI)
- [x] **v1.3.0**: Firebase Authentication (Google Sign-In), Cloud Firestore Sync, Automatic Gemini Connection via Firebase AI Logic, Hardened Security Rules
- [ ] **v1.4.0**: Sandboxed WASM / Piston in-browser code execution runtime
- [ ] **v1.5.0**: IDE Extensions (VS Code & JetBrains plugins)

---

## 08. Contributing & License

Contributions, feedback, and issue reports are warmly welcomed! Please feel free to open an issue or submit a Pull Request.

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">

<br/>

**Built with ❤️ by [Aditya Chaudhari](https://github.com/Adihtya)**

*DebugX — Code smarter. Debug faster. Learn deeper.*

</div>
