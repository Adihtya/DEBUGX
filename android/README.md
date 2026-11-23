# DebugX — Native Android Kotlin & Jetpack Compose Application

**Product:** DebugX  
**Tagline:** *Find the Bug. Understand the Cause. Fix with Confidence.*  
**Package:** `com.debugx.app`  
**Minimum SDK:** API 26 (Android 8.0 Oreo)  
**Target SDK:** API 34 (Android 14)

---

## Project Structure

```
android/
├── app/
│   ├── build.gradle.kts                   # App-level build configurations & dependencies
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml        # Permissions and Activity declaration
│           ├── java/com/debugx/app/
│           │   ├── MainActivity.kt        # Entry point with Compose Navigation & BottomBar
│           │   ├── ui/
│           │   │   ├── theme/             # Color, Theme, Type
│           │   │   ├── navigation/        # Screen routes
│           │   │   ├── components/        # Reusable CodeViewer, Badges, ModeSelector
│           │   │   └── screens/           # Home, DebugWorkspace, Results, FollowUpChat, History, Learn, Profile
│           │   ├── data/
│           │   │   ├── model/             # Section 14 DebugResponse & SampleData
│           │   │   ├── remote/            # GeminiService (multimodal API & fallback)
│           │   │   └── repository/        # DebugRepository & HistoryRepository
│           │   └── viewmodel/             # DebugViewModel with StateFlow & Coroutines
│           └── res/
│               └── values/                # strings.xml, colors.xml, themes.xml
├── gradle/
│   ├── wrapper/                           # Gradle 8.7 wrapper
│   └── libs.versions.toml                 # Version catalog
├── build.gradle.kts                       # Root project build file
├── settings.gradle.kts                    # Root settings
├── gradle.properties                      # JVM args & AndroidX settings
├── gradlew                                # Executable Gradle wrapper (Unix)
└── gradlew.bat                            # Executable Gradle wrapper (Windows)
```

## How to Compile the APK

```bash
./gradlew assembleDebug
```

The APK will be located at:
`app/build/outputs/apk/debug/app-debug.apk`
