<div align="center">

# <span style="color:#A78BFA;">DEBUG</span><span style="color:#38BDF8;">X</span>

### AI-POWERED DEBUGGING & CODE INTELLIGENCE

**Find the Bug. Understand the Cause. Fix with Confidence.**

[![Backend - Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Database - PostgreSQL with RLS](https://img.shields.io/badge/Database-PostgreSQL%20RLS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/docs/guides/database)
[![AI - Google Gemini 1.5 Flash](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-8B5CF6?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Storage - Supabase Storage](https://img.shields.io/badge/Storage-Supabase%20Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/docs/guides/storage)
[![Platform - Android & Web](https://img.shields.io/badge/Platform-Android%20%7C%20Web-38BDF8?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX)
[![Release - v2.0.0](https://img.shields.io/badge/Release-v2.0.0%20APK-22C55E?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Adihtya/DEBUGX/releases/latest)

<br/>

[📱 **Download Android APK (v2.0.0)**](https://github.com/Adihtya/DEBUGX/releases/download/v2.0.0/app-debug.apk) &nbsp; • &nbsp;
[🌐 **Live Web App**](#-quick-start) &nbsp; • &nbsp;
[✨ **Features**](#-features) &nbsp; • &nbsp;
[🐘 **Supabase Architecture**](#-supabase-architecture--schema) &nbsp; • &nbsp;
[🧠 **Explain My Code**](#-feature-spotlight-explain-my-code) &nbsp; • &nbsp;
[🚀 **Installation & Deployment**](#-installation--deployment)

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:090B10,50:241747,100:090B10&height=3" width="100%" />

</div>

## 01. About DEBUGX

**DEBUGX** is an AI-powered code analysis and debugging assistant crafted for developers, students, and engineers. It doesn't just hand you a patch—it demystifies what went wrong, explains the execution mechanics, and guides you to write resilient, clean code.

> **"Don't just fix the bug. Understand it."**

Whether you are debugging compiler errors on your laptop screen via your smartphone camera, pasting broken algorithms into the interactive web workbench, or stepping through loop iterations line-by-line, DebugX provides the clarity you need.

With **v2.0.0**, DebugX has undergone a complete, ground-up migration from Firebase to **Supabase**:
- **Authentication**: Supabase Auth with Google OAuth across Web & Android.
- **Database**: Supabase PostgreSQL (`profiles`, `debugging_history`, `user_preferences`) fortified by Row Level Security (RLS).
- **Storage**: Supabase Storage private bucket (`debugx-uploads`) for captured error screenshots.
- **Server-Side AI**: Google Gemini 1.5 Flash executed securely via Supabase Edge Functions (`analyze-code`), ensuring **zero API key exposure** on client devices.

---

## 02. Features

<table>
<tr>
<td width="50%" valign="top">

### 🔐 Supabase Auth & Google OAuth *(v2.0.0)*
- **One-Tap Google Sign-In**: Supabase Auth with Google OAuth on Web & Android Credential Manager.
- **Auto-Sync Profiles**: Trigger-based profile creation and preference provisioning in PostgreSQL.
- **Strict Row Level Security (RLS)**: Client isolation ensuring users can strictly access only their own records.
- **Zero Client API Key Leakage**: Gemini API keys live exclusively in Supabase Edge Function environment secrets.

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
- **Cloud PostgreSQL Sync**: Seamless offline caching with cloud database synchronization.

</td>
</tr>
</table>

---

## 03. Supabase Architecture & Schema

DebugX v2.0.0 is architectured around Supabase's open-source suite:

```
┌────────────────────────────────────────────────────────┐
│               DebugX Client (Web / Android)            │
│          "Find the Bug. Understand. Fix."              │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Supabase Auth │    │Supabase DB   │    │Supabase      │
│Google OAuth  │    │PostgreSQL RLS│    │Storage       │
│Session State │    │History/Prefs │    │debugx-uploads│
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │   Supabase Edge Function    │
            │        analyze-code         │
            │   (Server-side Execution)   │
            └──────────────┬──────────────┘
                           │  Secure Server Request
                           ▼  with GEMINI_API_KEY
            ┌─────────────────────────────┐
            │   Google Gemini 1.5 Flash   │
            │   Multimodal Vision & AI    │
            └─────────────────────────────┘
```

### PostgreSQL Database Schema:

#### 1. `profiles`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Matches authenticated Supabase user |
| `full_name` | TEXT | DEFAULT 'Developer' | User display name |
| `email` | TEXT | - | User email |
| `avatar_url` | TEXT | - | Profile picture URL |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### 2. `debugging_history`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique session ID |
| `user_id` | UUID | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Associated user |
| `title` | TEXT | NOT NULL | Error diagnostic title |
| `programming_language` | TEXT | NOT NULL DEFAULT 'Python' | Code language |
| `original_code` | TEXT | NOT NULL | Submitted source code |
| `error_message` | TEXT | - | Diagnostic summary |
| `error_type` | TEXT | DEFAULT 'Runtime Error' | Classification category |
| `root_cause` | TEXT | - | Detailed breakdown |
| `corrected_code` | TEXT | - | Production-ready patch |
| `explanation` | JSONB | DEFAULT '[]'::jsonb | Step-by-step resolution |
| `severity` | TEXT | CHECK (Low, Medium, High, Critical) | Severity level |
| `screenshot_url` | TEXT | - | Storage path if applicable |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp |

#### 3. `user_preferences`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Preferences ID |
| `user_id` | UUID | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE | Associated user |
| `explanation_mode` | TEXT | DEFAULT 'beginner' CHECK (beginner, advanced) | Mode |
| `preferred_language`| TEXT | DEFAULT 'Python' | Preferred language |
| `theme` | TEXT | DEFAULT 'dark' | Theme |

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

## 05. Quick Start

### 📱 Android Application (Direct APK Install)

1. Download the latest debug APK from the releases page:
   **[Download DebugX v2.0.0 APK](https://github.com/Adihtya/DEBUGX/releases/download/v2.0.0/app-debug.apk)**
2. On your Android device, allow installation from unknown sources if prompted.
3. Open DebugX, tap **Continue with Google** (or **Continue as Demo Developer** for instant offline exploration), and start debugging!

---

### 🌐 Web Prototype (Local Server)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Adihtya/DEBUGX.git
   cd DEBUGX
   ```

2. **Start the web server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
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

## 06. Supabase Deployment & Configuration Guide

To deploy your own production Supabase backend for DebugX:

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Note your **Project URL** and **anon public key** from **Project Settings > API**.

### Step 2: Apply Database Schema & Storage Bucket
Run the migration file located in [`supabase/migrations/20261124000000_init_debugx_schema.sql`](file:///Users/adityachaudhari/Downloads/DEBUGX/supabase/migrations/20261124000000_init_debugx_schema.sql) in your **Supabase SQL Editor**. This will:
- Create `profiles`, `debugging_history`, and `user_preferences` tables.
- Enable Row Level Security (RLS) on all tables.
- Create the `handle_new_user()` auto-provisioning trigger.
- Create the private `debugx-uploads` storage bucket with user-isolated RLS.

### Step 3: Deploy the Edge Function & Set Gemini Secret
1. Deploy the `analyze-code` function using Supabase CLI:
   ```bash
   supabase functions deploy analyze-code
   ```
2. Set your Gemini API key as a server-side secret:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Your API key is stored securely in Supabase Edge Function secrets and is never exposed to users).*

### Step 4: Configure Google OAuth
1. Go to **Authentication > Providers > Google** in the Supabase Dashboard.
2. Enable Google provider and input your **Google Client ID** and **Client Secret** (from Google Cloud Console).
3. Add the redirect URL shown in Supabase to your Google Cloud OAuth Authorized Redirect URIs.

---

## 07. Project Roadmap

- [x] **v1.0.0**: Core AI Code Debugger, Error Classification, Fix Generator, Learning Centre, Offline History
- [x] **v1.1.0**: Live Camera Capture (CameraX on Android, `getUserMedia` on Web), Screen Error Scanning, Image Upload
- [x] **v1.2.0**: Feature 3: Explain My Code (Line-by-line sync, Loop/Function visualizers, Variable tracking, Complexity analysis, Ask AI)
- [x] **v2.0.0**: Complete Migration from Firebase to Supabase (Supabase Auth, PostgreSQL with RLS, Supabase Storage, Supabase Edge Functions with Gemini 1.5 Flash)
- [ ] **v2.1.0**: Sandboxed in-browser code execution runtime (WASM / Piston)
- [ ] **v2.2.0**: IDE Extensions (VS Code & JetBrains plugins)

---

## 08. Contributing & License

Contributions, feedback, and issue reports are warmly welcomed! Please feel free to open an issue or submit a Pull Request.

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">

<br/>

**Built with ❤️ by [Aditya Chaudhari](https://github.com/Adihtya)**

*DebugX — Code smarter. Debug faster. Learn deeper.*

</div>
