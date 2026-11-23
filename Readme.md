<div align="center">

# <span style="color:#A78BFA;">DEBUG</span><span style="color:#38BDF8;">X</span>

### AI-POWERED DEBUGGING & CODE INTELLIGENCE

**Find the Bug. Understand the Cause. Fix with Confidence.**

[![AI - Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8B5CF6?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Platform - Android & Web](https://img.shields.io/badge/Platform-Android%20%7C%20Web-38BDF8?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX)
[![Release - v1.2.0](https://img.shields.io/badge/Release-v1.2.0%20APK-22C55E?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX/releases/latest)
[![Kotlin - Jetpack Compose](https://img.shields.io/badge/Android-Jetpack%20Compose-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Node.js Server](https://img.shields.io/badge/Web-Node.js%20%2B%20Vanilla%20JS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

<br/>

[📱 **Download Android APK (v1.2.0)**](https://github.com/Adihtya/DEBUGX/releases/download/v1.2.0/app-debug.apk) &nbsp; • &nbsp;
[🌐 **Live Web App**](#-quick-start) &nbsp; • &nbsp;
[✨ **Features**](#-features) &nbsp; • &nbsp;
[🧠 **Explain My Code**](#-feature-spotlight-explain-my-code) &nbsp; • &nbsp;
[🚀 **Installation**](#-installation--build)

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:090B10,50:241747,100:090B10&height=3" width="100%" />

</div>

## 01. About DEBUGX

**DEBUGX** is an AI-powered code analysis and debugging assistant crafted for developers, students, and engineers. It doesn't just hand you a patch—it demystifies what went wrong, explains the execution mechanics, and guides you to write resilient, clean code.

> **"Don't just fix the bug. Understand it."**

Whether you are debugging compiler errors on your laptop screen via your smartphone camera, pasting broken algorithms into the interactive web workbench, or stepping through loop iterations line-by-line, DebugX provides the clarity you need.

---

## 02. Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 Explain My Code *(v1.2.0)*
- **Interactive Line-by-Line Breakdown**: Click any code line to inspect its purpose and runtime role.
- **Variable Tracking & Scopes**: Automatic detection of data types, scopes, declarations, and usages.
- **Loop & Function Visualizers**: Step-by-step iteration state table and call stack frame hierarchy.
- **Complexity Analysis**: Big-O time and space complexity with clear mathematical rationale.
- **Honest AI Output Prediction**: Clear demarcation between statically deduced output and sandbox runtime.
- **Dual Explanation Modes**: *Beginner Mode* (plain English & analogies) or *Advanced Mode* (AST, memory & performance).

</td>
<td width="50%" valign="top">

### 📸 Live Camera & Snap-to-Debug *(v1.1.0)*
- **Hardware CameraX Integration**: Native Android camera viewfinder with front/rear lens toggle.
- **Physical Screen Capture**: Snap code and stack traces directly off laptop monitors or terminal screens.
- **Web Browser Camera**: HTML5 `getUserMedia` camera preview with instant retake and capture controls.
- **Multimodal Gemini Vision**: Simultaneous OCR, syntax parsing, and error extraction.
- **Hybrid Input**: Combine captured camera photos with pasted code for complete context.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🐛 AI Code Debugger
- **Deep Root Cause Diagnosis**: Pinpoint syntax, logical, and runtime bugs.
- **Ready-to-Use Code Patches**: Side-by-side original vs. corrected code diffs.
- **Actionable Explanations**: Clear bullet points explaining why the error occurred.
- **Multi-language Support**: Python, JavaScript, Java, C++, Kotlin, Go, Rust, TypeScript, and more.

</td>
<td width="50%" valign="top">

### 💬 Interactive AI Follow-up Chat
- **Context-Aware Dialogue**: Ask questions directly referencing the analyzed code.
- **Alternative Approaches**: Request alternate algorithms or optimized patterns.
- **Concept Deep-Dives**: Ask about language idioms, memory safety, or edge cases.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📚 Learning Centre
- **Categorized Error Knowledge Base**: Common pitfalls across JavaScript, Python, C++, and Java.
- **Interactive Bug Challenges**: Real-world buggy snippets to test your diagnostic skills.
- **Practice Quizzes**: Instant feedback on debugging logic and compiler mechanics.

</td>
<td width="50%" valign="top">

### 📂 History & Session Management
- **Local Offline Persistence**: All debugging and explanation sessions cached locally.
- **Instant Search & Filter**: Search past sessions by code snippet, language, or error keyword.
- **Export to JSON**: Download session histories for documentation or team sharing.

</td>
</tr>
</table>

---

## 03. Feature Spotlight: Explain My Code

DebugX v1.2.0 introduces **Explain My Code**—an interactive code intelligence engine designed to make complex algorithms crystal clear.

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

### Key Capabilities:
1. **Interactive Line Sync**: Tapping any line in the code editor highlights its corresponding explanation card, and vice-versa.
2. **Variable Intelligence**: Inspect variable lifecycle, assignments, and mutations across scopes.
3. **Loop & Function Visualizer**: View iteration-by-iteration state changes and function call hierarchies.
4. **Honest Output Notice**: DebugX explicitly flags whether output was statically derived via AI AST analysis or measured in a secure sandbox execution environment.

---

## 04. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Android Application** | Kotlin, Jetpack Compose, Material 3, CameraX, Kotlin Coroutines, StateFlow, ViewModel |
| **Web Application** | HTML5, CSS3 (Modern Dark Theme `#090909`), JavaScript (ES2022), Express.js (Node.js) |
| **Artificial Intelligence** | Google Gemini 1.5 Flash (`google-generativeai` SDK), Multimodal Vision API |
| **CI / CD Automation** | GitHub Actions, Gradle Wrapper, Automated APK Artifact & Release Pipeline |

---

## 05. Quick Start

### 📱 Android Application (Direct APK Install)

1. Download the latest debug APK from the releases page:
   **[Download DebugX v1.2.0 APK](https://github.com/Adihtya/DEBUGX/releases/download/v1.2.0/app-debug.apk)**
2. On your Android device, allow installation from unknown sources if prompted.
3. Open DebugX and start debugging!

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

## 06. Google Gemini API Configuration

DebugX includes built-in offline mock fallbacks for all features, so you can explore the UI immediately. To connect live Gemini AI analysis:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. In the DebugX Web App or Android App:
   - Navigate to the **Profile / Settings** tab.
   - Enter your Gemini API key in the input field.
   - Click **Save Key**.
3. All debugging, vision OCR, and code explanation requests will now use live Gemini 1.5 Flash models.

*(Your key is stored securely in your device's local storage and is never transmitted to any third-party servers).*

---

## 07. Project Roadmap

- [x] **v1.0.0**: Core AI Code Debugger, Error Classification, Fix Generator, Learning Centre, Offline History
- [x] **v1.1.0**: Live Camera Capture (CameraX on Android, `getUserMedia` on Web), Screen Error Scanning, Image Upload
- [x] **v1.2.0**: Feature 3: Explain My Code (Line-by-line sync, Loop/Function visualizers, Variable tracking, Complexity analysis, Ask AI)
- [ ] **v1.3.0**: Sandboxed WASM / Piston in-browser code execution runtime
- [ ] **v1.4.0**: IDE Extensions (VS Code & JetBrains plugins)

---

## 08. Contributing & License

Contributions, feedback, and issue reports are warmly welcomed! Please feel free to open an issue or submit a Pull Request.

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">

<br/>

**Built with ❤️ by [Aditya Chaudhari](https://github.com/Adihtya)**

*DebugX — Code smarter. Debug faster. Learn deeper.*

</div>
