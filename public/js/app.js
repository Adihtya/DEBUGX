/**
 * DEBUGX — Main Application Controller
 * Handles Navigation, State, Workspace, Results, and Event Bindings
 */

class AppController {
  constructor() {
    this.currentScreen = 'screenHome';
    this.currentSession = null;
    this.activeExplanationMode = 'beginner';
    this.currentTipIndex = 0;
    this.uploadedImageBase64 = null;
    this.uploadedImageMime = null;
  }

  init() {
    this.initClock();
    this.bindNavigation();
    this.bindCamera();
    this.bindWorkspace();
    this.bindResults();
    this.bindChat();
    this.bindHistory();
    this.bindLearn();
    this.bindProfile();
    this.bindDeviceFrameToggle();
    this.renderHome();
    this.updateApiStatusIndicator();
  }

  // --- Real-time Android Status Bar Clock ---
  initClock() {
    const clockEl = document.getElementById('statusClock');
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      if (clockEl) clockEl.textContent = `${hours}:${mins}`;
    };
    update();
    setInterval(update, 30000);
  }

  // --- Navigation & Screen Switching ---
  bindNavigation() {
    const navItems = document.querySelectorAll('.android-bottom-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetScreen = item.getAttribute('data-screen');
        this.switchScreen(targetScreen);
      });
    });

    // Top quick actions / buttons
    document.getElementById('heroStartDebugBtn')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
    });

    document.getElementById('heroSampleBtn')?.addEventListener('click', () => {
      this.loadSection18Sample();
    });

    document.getElementById('quickActionScreenshot')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
      this.setWorkspaceTab('screenshot');
    });

    document.getElementById('quickActionCode')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
      this.setWorkspaceTab('code');
    });

    document.getElementById('quickActionCombined')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
      this.setWorkspaceTab('combined');
    });

    document.getElementById('viewAllHistoryLink')?.addEventListener('click', () => {
      this.switchScreen('screenHistory');
    });

    document.getElementById('openSettingsQuickBtn')?.addEventListener('click', () => {
      this.switchScreen('screenProfile');
    });

    document.getElementById('apiKeyIndicator')?.addEventListener('click', () => {
      this.switchScreen('screenProfile');
    });

    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('notificationsModal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('closeNotificationsBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('notificationsModal');
      if (modal) modal.style.display = 'none';
    });
  }

  switchScreen(screenId) {
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }

    // Update bottom nav active state
    const navItems = document.querySelectorAll('.android-bottom-nav .nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-screen') === screenId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Specific screen initializers
    if (screenId === 'screenHome') this.renderHome();
    if (screenId === 'screenHistory') this.renderHistoryList();
    if (screenId === 'screenLearn') window.learnController?.init();

    // Scroll to top of app body
    const body = document.querySelector('.app-body');
    if (body) body.scrollTop = 0;
  }

  // --- Workspace & Code Editor ---
  bindWorkspace() {
    // Mode tabs (Combined, Code, Screenshot)
    const tabPills = document.querySelectorAll('#screenDebug .tab-pill');
    tabPills.forEach(pill => {
      pill.addEventListener('click', () => {
        tabPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.setWorkspaceTab(pill.getAttribute('data-tab'));
      });
    });

    // Sample Bug button in Workspace header
    document.getElementById('loadSampleWorkspaceBtn')?.addEventListener('click', () => {
      this.loadSection18Sample();
    });

    // Code Textarea line numbering
    const textarea = document.getElementById('codeTextarea');
    if (textarea) {
      textarea.addEventListener('input', () => this.updateLineNumbers());
      textarea.addEventListener('scroll', () => {
        const lineNums = document.getElementById('editorLineNumbers');
        if (lineNums) lineNums.scrollTop = textarea.scrollTop;
      });
    }

    // Clear Code button
    document.getElementById('clearCodeBtn')?.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';
        this.updateLineNumbers();
      }
    });

    // Paste from clipboard button
    document.getElementById('pasteClipboardBtn')?.addEventListener('click', async () => {
      try {
        const clip = await navigator.clipboard.readText();
        if (clip && textarea) {
          textarea.value = clip;
          this.updateLineNumbers();
          this.showToast("Pasted from clipboard", "info");
        }
      } catch (e) {
        this.showToast("Clipboard permission required. You can paste with Ctrl+V / Cmd+V.", "warning");
      }
    });

    // Language selector change
    const langSelect = document.getElementById('codeLanguageSelect');
    langSelect?.addEventListener('change', (e) => {
      const filenameEl = document.getElementById('editorFilename');
      const val = e.target.value;
      const map = {
        python: 'main.py',
        kotlin: 'MainActivity.kt',
        java: 'Main.java',
        javascript: 'index.js',
        typescript: 'index.ts',
        cpp: 'main.cpp',
        c: 'main.c',
        swift: 'App.swift',
        go: 'main.go',
        rust: 'main.rs',
        sql: 'query.sql',
        html: 'index.html',
        css: 'style.css'
      };
      if (filenameEl) filenameEl.textContent = map[val] || 'source_file.txt';
    });

    // Explanation Mode Radio Buttons
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        modeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const input = opt.querySelector('input');
        if (input) {
          input.checked = true;
          this.activeExplanationMode = input.value;
          const badge = document.getElementById('activeModeBadge');
          if (badge) {
            badge.textContent = input.value === 'advanced' ? 'Advanced Mode' : 'Beginner Mode';
          }
        }
      });
    });

    // Screenshot file drop & input
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('screenshotFileInput');
    const browseBtn = document.getElementById('browseImagesBtn');

    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', (e) => {
      if (e.target.closest('#replaceImageBtn') || e.target.closest('#removeImageBtn')) return;
      if (!this.uploadedImageBase64) fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.handleImageUpload(file);
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone?.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) this.handleImageUpload(file);
    });

    document.getElementById('removeImageBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearUploadedImage();
    });

    document.getElementById('replaceImageBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });

    // Submit: Analyse My Code Button
    document.getElementById('analyseCodeBtn')?.addEventListener('click', () => {
      this.startAnalysis();
    });
  }

  setWorkspaceTab(tab) {
    const screenshotSection = document.getElementById('screenshotSection');
    const codeSection = document.getElementById('codeSection');

    if (tab === 'camera') {
      if (screenshotSection) screenshotSection.style.display = 'flex';
      if (codeSection) codeSection.style.display = 'flex';
      this.openCamera();
    } else if (tab === 'screenshot') {
      if (screenshotSection) screenshotSection.style.display = 'flex';
      if (codeSection) codeSection.style.display = 'none';
    } else if (tab === 'code') {
      if (screenshotSection) screenshotSection.style.display = 'none';
      if (codeSection) codeSection.style.display = 'flex';
    } else {
      // Combined
      if (screenshotSection) screenshotSection.style.display = 'flex';
      if (codeSection) codeSection.style.display = 'flex';
    }
  }

  // --- Live Camera Controller ---
  bindCamera() {
    this.cameraStream = null;
    this.cameraFacingMode = 'environment'; // default to rear camera for monitor capture
    this.capturedTempPhoto = null;

    // Trigger buttons
    document.getElementById('quickActionCamera')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
      this.setWorkspaceTab('combined');
      this.openCamera();
    });

    document.getElementById('openLiveCameraBtn')?.addEventListener('click', () => {
      this.openCamera();
    });

    // Close & Cancel buttons
    document.getElementById('closeCameraBtn')?.addEventListener('click', () => {
      this.closeCamera();
    });

    document.getElementById('cameraCancelBtn')?.addEventListener('click', () => {
      this.closeCamera();
    });

    // Flip camera buttons (top & bottom)
    document.getElementById('flipCameraBtn')?.addEventListener('click', () => {
      this.flipCamera();
    });

    document.getElementById('cameraFlipBottomBtn')?.addEventListener('click', () => {
      this.flipCamera();
    });

    // Capture shutter button
    document.getElementById('cameraShutterBtn')?.addEventListener('click', () => {
      this.capturePhoto();
    });

    // Retake button
    document.getElementById('cameraRetakeBtn')?.addEventListener('click', () => {
      this.retakePhoto();
    });

    // Use Photo button
    document.getElementById('cameraUsePhotoBtn')?.addEventListener('click', () => {
      this.usePhoto(false);
    });

    // Use Photo & Analyse Now button
    document.getElementById('cameraUseAndAnalyseBtn')?.addEventListener('click', () => {
      this.usePhoto(true);
    });

    // Error retry & fallback
    document.getElementById('retryCameraBtn')?.addEventListener('click', () => {
      this.openCamera();
    });

    document.getElementById('cameraFallbackUploadBtn')?.addEventListener('click', () => {
      this.closeCamera();
      document.getElementById('screenshotFileInput')?.click();
    });
  }

  async openCamera() {
    const modal = document.getElementById('liveCameraModal');
    const video = document.getElementById('cameraVideo');
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewControls');
    const previewOverlay = document.getElementById('cameraPreviewOverlay');
    const errorOverlay = document.getElementById('cameraErrorOverlay');
    const guideOverlay = document.getElementById('cameraGuideOverlay');

    if (!modal || !video) return;

    modal.style.display = 'flex';
    if (liveControls) liveControls.style.display = 'flex';
    if (reviewControls) reviewControls.style.display = 'none';
    if (previewOverlay) previewOverlay.style.display = 'none';
    if (errorOverlay) errorOverlay.style.display = 'none';
    if (guideOverlay) guideOverlay.style.display = 'flex';

    this.stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showCameraError("Camera Not Supported", "Your browser does not support the mediaDevices.getUserMedia camera API.");
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: this.cameraFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to basic video if facingMode constraint fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.cameraStream = stream;
      video.srcObject = stream;
      await video.play().catch(() => {});
      this.showToast("Camera active. Align code or screen in frame.", "info");
    } catch (err) {
      console.error("Camera access error:", err);
      let title = "Camera Permission Needed";
      let msg = "Camera access was denied or blocked. Please allow camera permissions in your browser.";
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        title = "No Camera Detected";
        msg = "No video camera hardware was found connected to this device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        title = "Camera In Use";
        msg = "The camera is currently occupied by another program or browser tab.";
      }
      this.showCameraError(title, msg);
    }
  }

  showCameraError(title, msg) {
    const errorOverlay = document.getElementById('cameraErrorOverlay');
    const errorTitle = document.getElementById('cameraErrorTitle');
    const errorMsg = document.getElementById('cameraErrorMessage');
    const guideOverlay = document.getElementById('cameraGuideOverlay');

    if (errorTitle) errorTitle.textContent = title;
    if (errorMsg) errorMsg.textContent = msg;
    if (errorOverlay) errorOverlay.style.display = 'flex';
    if (guideOverlay) guideOverlay.style.display = 'none';
    this.showToast(title, "error");
  }

  async flipCamera() {
    this.cameraFacingMode = this.cameraFacingMode === 'environment' ? 'user' : 'environment';
    await this.openCamera();
  }

  capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const capturedImg = document.getElementById('cameraCapturedImg');
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewControls');
    const previewOverlay = document.getElementById('cameraPreviewOverlay');
    const guideOverlay = document.getElementById('cameraGuideOverlay');

    if (!video || !canvas || !capturedImg) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.capturedTempPhoto = dataUrl;

    capturedImg.src = dataUrl;
    if (previewOverlay) previewOverlay.style.display = 'flex';
    if (guideOverlay) guideOverlay.style.display = 'none';
    if (liveControls) liveControls.style.display = 'none';
    if (reviewControls) reviewControls.style.display = 'flex';

    this.showToast("Photo captured! Check preview or Retake.", "success");
  }

  retakePhoto() {
    this.capturedTempPhoto = null;
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewControls');
    const previewOverlay = document.getElementById('cameraPreviewOverlay');
    const guideOverlay = document.getElementById('cameraGuideOverlay');

    if (previewOverlay) previewOverlay.style.display = 'none';
    if (guideOverlay) guideOverlay.style.display = 'flex';
    if (liveControls) liveControls.style.display = 'flex';
    if (reviewControls) reviewControls.style.display = 'none';
  }

  usePhoto(autoAnalyse = false) {
    if (!this.capturedTempPhoto) {
      this.showToast("No captured photo available.", "warning");
      return;
    }

    this.uploadedImageBase64 = this.capturedTempPhoto;
    this.uploadedImageMime = 'image/jpeg';

    // Update preview UI in workspace
    const previewImg = document.getElementById('screenshotPreviewImg');
    const filenameEl = document.getElementById('previewFilename');
    const filesizeEl = document.getElementById('previewFilesize');
    const idleState = document.getElementById('uploadIdleState');
    const previewState = document.getElementById('uploadPreviewState');

    if (previewImg) previewImg.src = this.uploadedImageBase64;
    if (filenameEl) filenameEl.textContent = `live_photo_${Date.now().toString().slice(-4)}.jpg`;
    if (filesizeEl) {
      const approxBytes = Math.round((this.uploadedImageBase64.length * 3) / 4);
      filesizeEl.textContent = `${(approxBytes / 1024).toFixed(1)} KB (Live Capture)`;
    }

    if (idleState) idleState.style.display = 'none';
    if (previewState) previewState.style.display = 'flex';

    this.closeCamera();
    this.switchScreen('screenDebug');
    this.setWorkspaceTab('combined');

    this.showToast("Photo loaded into workspace!", "success");

    if (autoAnalyse) {
      setTimeout(() => this.startAnalysis(), 250);
    }
  }

  stopCameraStream() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.cameraStream = null;
    }
  }

  closeCamera() {
    this.stopCameraStream();
    const video = document.getElementById('cameraVideo');
    if (video) video.srcObject = null;
    const modal = document.getElementById('liveCameraModal');
    if (modal) modal.style.display = 'none';
    this.capturedTempPhoto = null;
  }

  handleImageUpload(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.showToast("Unsupported file format. Please upload PNG or JPG.", "error");
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast("File size exceeds 10MB limit.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImageBase64 = e.target.result;
      this.uploadedImageMime = file.type;

      // Update preview UI
      const previewImg = document.getElementById('screenshotPreviewImg');
      const filenameEl = document.getElementById('previewFilename');
      const filesizeEl = document.getElementById('previewFilesize');
      const idleState = document.getElementById('uploadIdleState');
      const previewState = document.getElementById('uploadPreviewState');

      if (previewImg) previewImg.src = this.uploadedImageBase64;
      if (filenameEl) filenameEl.textContent = file.name;
      if (filesizeEl) filesizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;

      if (idleState) idleState.style.display = 'none';
      if (previewState) previewState.style.display = 'flex';

      this.showToast("Screenshot loaded successfully", "success");
    };
    reader.readAsDataURL(file);
  }

  clearUploadedImage() {
    this.uploadedImageBase64 = null;
    this.uploadedImageMime = null;
    const fileInput = document.getElementById('screenshotFileInput');
    if (fileInput) fileInput.value = '';

    const idleState = document.getElementById('uploadIdleState');
    const previewState = document.getElementById('uploadPreviewState');
    if (idleState) idleState.style.display = 'flex';
    if (previewState) previewState.style.display = 'none';
  }

  updateLineNumbers() {
    const textarea = document.getElementById('codeTextarea');
    const lineNums = document.getElementById('editorLineNumbers');
    if (!textarea || !lineNums) return;

    const lines = (textarea.value || '').split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(lines, 4); i++) {
      numbersHtml += `${i}<br>`;
    }
    lineNums.innerHTML = numbersHtml;
  }

  loadSection18Sample() {
    const sample = DEBUGX_SAMPLE_DEMO;
    const textarea = document.getElementById('codeTextarea');
    const select = document.getElementById('codeLanguageSelect');

    if (textarea) textarea.value = sample.original_code;
    if (select) select.value = 'python';

    this.updateLineNumbers();
    this.switchScreen('screenDebug');
    this.setWorkspaceTab('code');

    this.showToast("Loaded Section 18 IndexError Sample", "info");
  }

  // --- Execution & Loading Animation ---
  async startAnalysis() {
    const textarea = document.getElementById('codeTextarea');
    const code = textarea?.value?.trim() || '';
    const langSelect = document.getElementById('codeLanguageSelect');
    const language = langSelect?.value || 'auto';

    if (!code && !this.uploadedImageBase64) {
      this.showToast("Please provide code or upload an error screenshot.", "error");
      return;
    }

    const overlay = document.getElementById('analysisLoadingOverlay');
    const progressFill = document.getElementById('analysisProgressFill');
    const titleEl = document.getElementById('loadingStageTitle');
    const subEl = document.getElementById('loadingStageSub');

    if (overlay) overlay.style.display = 'flex';

    // Step 1: Multimodal OCR & Syntax parsing
    if (progressFill) progressFill.style.width = '30%';
    if (titleEl) titleEl.textContent = 'Parsing Code & Error Traces...';
    document.getElementById('stepOCR')?.classList.add('active');

    await new Promise(r => setTimeout(r, 600));

    // Step 2: Isolating root cause with Gemini
    if (progressFill) progressFill.style.width = '70%';
    if (titleEl) titleEl.textContent = 'Consulting Gemini Debugging Engine...';
    if (subEl) subEl.textContent = 'Analyzing runtime semantics and bounds';
    document.getElementById('stepCause')?.classList.add('active');

    // Check if input matches Section 18 sample
    const isSample = code.includes('numbers = [10, 20, 30]') && code.includes('numbers[5]');

    try {
      const result = await window.geminiService.analyseCode({
        code,
        imageBase64: this.uploadedImageBase64,
        imageMimeType: this.uploadedImageMime,
        language,
        mode: this.activeExplanationMode,
        isSample
      });

      // Step 3: Synthesis complete
      if (progressFill) progressFill.style.width = '100%';
      if (titleEl) titleEl.textContent = 'Synthesizing Fix & Prevention Checklist...';
      document.getElementById('stepFix')?.classList.add('active');

      await new Promise(r => setTimeout(r, 500));

      if (overlay) overlay.style.display = 'none';

      // Store current session
      this.currentSession = result;

      // Automatically persist to history if not sample, or as requested
      window.historyManager?.saveSession(result);

      // Render results
      this.renderResults(result);
      this.switchScreen('screenResults');
      this.showToast("Debugging analysis completed!", "success");

    } catch (err) {
      if (overlay) overlay.style.display = 'none';
      this.showToast("Analysis error: " + err.message, "error");
    }
  }

  // --- Results Screen Binding & Rendering ---
  bindResults() {
    document.getElementById('backToWorkspaceBtn')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
    });

    document.getElementById('saveSessionBtn')?.addEventListener('click', () => {
      if (this.currentSession) {
        window.historyManager?.saveSession(this.currentSession);
        this.showToast("Analysis saved to History!", "success");
      }
    });

    // Copy Fix Code button
    document.getElementById('copyFixBtn')?.addEventListener('click', async () => {
      const code = document.getElementById('resCorrectedCode')?.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        const textSpan = document.getElementById('copyFixBtnText');
        if (textSpan) textSpan.textContent = 'Copied!';
        setTimeout(() => {
          if (textSpan) textSpan.textContent = 'Copy Code';
        }, 2000);
        this.showToast("Fixed code copied to clipboard", "success");
      } catch (e) {
        this.showToast("Failed to copy code to clipboard", "error");
      }
    });

    // Results Mode Quick-Switchers (Beginner vs Advanced)
    const begBtn = document.getElementById('resultModeBeginnerBtn');
    const advBtn = document.getElementById('resultModeAdvancedBtn');

    begBtn?.addEventListener('click', () => {
      begBtn.classList.add('active');
      advBtn.classList.remove('active');
      this.activeExplanationMode = 'beginner';
      if (this.currentSession) {
        this.updateExplanationModeView('beginner');
      }
    });

    advBtn?.addEventListener('click', () => {
      advBtn.classList.add('active');
      begBtn.classList.remove('active');
      this.activeExplanationMode = 'advanced';
      if (this.currentSession) {
        this.updateExplanationModeView('advanced');
      }
    });

    document.getElementById('openFollowUpChatBtn')?.addEventListener('click', () => {
      this.initFollowUpChat();
      this.switchScreen('screenChat');
    });
  }

  renderResults(data) {
    // Sample badge toggle
    const sampleBanner = document.getElementById('sampleDataBanner');
    if (sampleBanner) {
      sampleBanner.style.display = data.is_sample ? 'flex' : 'none';
    }

    // Overview Card
    document.getElementById('resCategory').textContent = data.error_category || 'Runtime Error';
    document.getElementById('resLanguage').textContent = data.language || 'Python';
    document.getElementById('resTitle').textContent = data.error_title || 'Error Identified';

    // Severity
    const sevBadge = document.getElementById('resSeverity');
    if (sevBadge) {
      const sev = (data.severity || 'Medium').toLowerCase();
      sevBadge.className = `severity-badge ${sev}`;
      sevBadge.textContent = `${data.severity} Severity`;
    }

    // Confidence
    const confVal = Math.round((data.confidence || 0.9) * 100);
    document.getElementById('resConfidence').textContent = `${confVal}%`;
    const confBar = document.getElementById('resConfidenceBar');
    if (confBar) confBar.style.width = `${confVal}%`;

    // Problematic lines
    const lineTag = document.getElementById('resProblemLines');
    if (lineTag) {
      lineTag.textContent = data.problematic_lines?.length
        ? `Line ${data.problematic_lines.join(', ')}`
        : 'Identified';
    }

    // What went wrong & Why did it happen
    document.getElementById('resSummary').textContent = data.summary;
    document.getElementById('resRootCause').textContent = data.root_cause;

    // Problematic Code with highlight
    const originalPre = document.getElementById('resOriginalCode');
    if (originalPre) {
      const lines = (data.original_code || '').split('\n');
      const errLines = data.problematic_lines || [1];
      const highlighted = lines.map((l, i) => {
        if (errLines.includes(i + 1)) {
          return `<span class="line-highlight-error">${this.escapeHtml(l)}  # <-- Issue identified here</span>`;
        }
        return this.escapeHtml(l);
      }).join('\n');
      originalPre.innerHTML = highlighted;
    }

    // Suggested Fix
    document.getElementById('resCorrectedCode').textContent = data.corrected_code;

    // Explanation list
    this.updateExplanationModeView(this.activeExplanationMode);

    // Prevention Tips
    const prevList = document.getElementById('resPreventionList');
    if (prevList) {
      prevList.innerHTML = (data.prevention_tips || []).map(tip => `<li>${this.escapeHtml(tip)}</li>`).join('');
    }

    // Related Concepts
    const conceptsBox = document.getElementById('resConceptsList');
    if (conceptsBox) {
      conceptsBox.innerHTML = (data.related_concepts || []).map(c => `
        <span class="concept-chip" onclick="appController.navigateToConcept('${this.escapeJs(c)}')">${this.escapeHtml(c)}</span>
      `).join('');
    }
  }

  updateExplanationModeView(mode) {
    const listEl = document.getElementById('resExplanationList');
    if (!listEl || !this.currentSession) return;

    let points = this.currentSession.explanation;
    if (this.currentSession.is_sample) {
      points = mode === 'advanced'
        ? this.currentSession.explanation_advanced || this.currentSession.explanation
        : this.currentSession.explanation_beginner || this.currentSession.explanation;
    }

    listEl.innerHTML = (points || []).map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
  }

  navigateToConcept(conceptName) {
    this.switchScreen('screenLearn');
    this.showToast(`Exploring concept: ${conceptName}`, 'info');
  }

  // --- Follow-Up Chat Binding & Processing ---
  bindChat() {
    document.getElementById('backToResultsBtn')?.addEventListener('click', () => {
      this.switchScreen('screenResults');
    });

    const sendBtn = document.getElementById('sendChatBtn');
    const input = document.getElementById('chatInputText');

    sendBtn?.addEventListener('click', () => this.handleSendChatMessage());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendChatMessage();
      }
    });

    // Quick suggestion chips
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) {
          if (input) input.value = query;
          this.handleSendChatMessage();
        }
      });
    });
  }

  initFollowUpChat() {
    const title = this.currentSession?.error_title || 'Debugging Session';
    const lang = this.currentSession?.language || 'Code';

    const pill = document.getElementById('chatContextName');
    if (pill) pill.textContent = `${lang} ${title.split(':')[0]}`;

    const label = document.getElementById('chatErrorTitleLabel');
    if (label) label.textContent = title;
  }

  async handleSendChatMessage() {
    const input = document.getElementById('chatInputText');
    const text = input?.value?.trim();
    if (!text) return;

    input.value = '';

    // Append User Bubble
    this.appendChatBubble('user', text);

    // Scroll to bottom
    const container = document.getElementById('chatMessages');
    if (container) container.scrollTop = container.scrollHeight;

    // Show AI typing placeholder
    const typingId = 'typing_' + Date.now();
    this.appendChatBubble('ai', 'Thinking...', typingId);

    try {
      const reply = await window.geminiService.askFollowUpChat({
        question: text,
        sessionContext: this.currentSession || DEBUGX_SAMPLE_DEMO
      });

      // Replace typing bubble
      const typingEl = document.getElementById(typingId);
      if (typingEl) {
        typingEl.querySelector('.bubble-content').innerHTML = this.formatMarkdownText(reply);
      }
    } catch (e) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) {
        typingEl.querySelector('.bubble-content').textContent = "I encountered an issue generating a response. Please try asking again.";
      }
    }

    if (container) container.scrollTop = container.scrollHeight;
  }

  appendChatBubble(role, content, customId = null) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'ai-bubble'}`;
    if (customId) div.id = customId;

    div.innerHTML = `
      <div class="bubble-avatar">${role === 'user' ? 'ME' : 'DX'}</div>
      <div class="bubble-content">
        ${role === 'user' ? this.escapeHtml(content) : this.formatMarkdownText(content)}
      </div>
    `;

    container.appendChild(div);
  }

  formatMarkdownText(text) {
    if (!text) return '';
    // Format bold, backticks, and lists
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n\* /g, '<br>• ');
  }

  // --- History Screen Rendering ---
  bindHistory() {
    const searchInput = document.getElementById('historySearchInput');
    searchInput?.addEventListener('input', () => this.renderHistoryList());

    const filterChips = document.querySelectorAll('#historyLangFilters .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderHistoryList();
      });
    });

    document.getElementById('clearAllHistoryBtn')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear your saved debugging history?")) {
        window.historyManager?.clearAll();
        this.renderHistoryList();
        this.showToast("History cleared", "info");
      }
    });

    document.getElementById('historyNewDebugBtn')?.addEventListener('click', () => {
      this.switchScreen('screenDebug');
    });
  }

  renderHistoryList() {
    const container = document.getElementById('historyListContainer');
    const emptyState = document.getElementById('historyEmptyState');
    if (!container) return;

    const query = document.getElementById('historySearchInput')?.value || '';
    const activeChip = document.querySelector('#historyLangFilters .filter-chip.active');
    const lang = activeChip?.getAttribute('data-filter') || 'all';

    const items = window.historyManager?.filter({ query, language: lang }) || [];

    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = items.map(item => `
      <div class="history-item" onclick="appController.loadSavedSession('${item.id}')">
        <div class="history-item-top">
          <span class="lang-pill">${this.escapeHtml(item.language)}</span>
          <span class="category-pill">${this.escapeHtml(item.error_category)}</span>
          <span class="text-muted" style="margin-left: auto; font-size: 0.72rem;">${item.timestamp}</span>
        </div>
        <div class="history-item-title">${this.escapeHtml(item.error_title)}</div>
        <div class="history-item-summary">${this.escapeHtml(item.summary)}</div>
        <div class="history-item-footer">
          <span>Confidence: ${Math.round((item.confidence || 0.9) * 100)}%</span>
          <button class="text-link-btn" onclick="event.stopPropagation(); appController.deleteSession('${item.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  loadSavedSession(id) {
    const list = window.historyManager?.getAll() || [];
    const item = list.find(i => i.id === id);
    if (item) {
      this.currentSession = item;
      this.renderResults(item);
      this.switchScreen('screenResults');
    }
  }

  deleteSession(id) {
    window.historyManager?.deleteSession(id);
    this.renderHistoryList();
    this.showToast("Session removed from history", "info");
  }

  // --- Home Screen Dynamic Elements ---
  renderHome() {
    // Render Tip of the day
    this.renderTip();

    document.getElementById('nextTipBtn')?.addEventListener('click', () => {
      this.currentTipIndex = (this.currentTipIndex + 1) % DEBUGX_TIPS.length;
      this.renderTip();
    });

    // Render Recent items
    const recentList = document.getElementById('homeRecentList');
    if (!recentList) return;

    const all = window.historyManager?.getAll() || [];
    const recents = all.slice(0, 3);

    if (recents.length === 0) {
      recentList.innerHTML = `<div class="empty-state"><p class="empty-desc">No recent activity. Start your first debugging run!</p></div>`;
      return;
    }

    recentList.innerHTML = recents.map(item => `
      <div class="activity-item" onclick="appController.loadSavedSession('${item.id}')">
        <div class="activity-left">
          <div class="lang-icon-badge">${(item.language || 'Py').slice(0, 2).toUpperCase()}</div>
          <div class="activity-meta">
            <span class="activity-title">${this.escapeHtml(item.error_title)}</span>
            <span class="activity-sub">
              <span>${item.language}</span> • <span>${item.timestamp}</span>
            </span>
          </div>
        </div>
        <div class="activity-right">
          <span class="severity-badge ${(item.severity || 'medium').toLowerCase()}">${item.severity}</span>
        </div>
      </div>
    `).join('');

    // Update errors analyzed count
    const totalErrors = document.getElementById('metricTotalErrors');
    if (totalErrors) totalErrors.textContent = Math.max(128, all.length + 125);
  }

  renderTip() {
    const tip = DEBUGX_TIPS[this.currentTipIndex];
    if (!tip) return;
    const titleEl = document.getElementById('tipTitle');
    const bodyEl = document.getElementById('tipBody');
    if (titleEl) titleEl.textContent = tip.title;
    if (bodyEl) bodyEl.textContent = tip.body;
  }

  // --- Learning Centre Tab Bindings ---
  bindLearn() {
    const tabs = document.querySelectorAll('#screenLearn .tab-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const view = tab.getAttribute('data-learntab');
        const views = document.querySelectorAll('.learn-subview');
        views.forEach(v => v.style.display = 'none');

        if (view === 'errors') {
          document.getElementById('learnErrorsView').style.display = 'block';
        } else if (view === 'challenges') {
          document.getElementById('learnChallengesView').style.display = 'block';
        } else if (view === 'quiz') {
          document.getElementById('learnQuizView').style.display = 'block';
        }
      });
    });

    const langPills = document.querySelectorAll('#learnLangScroll .pill-btn');
    langPills.forEach(pill => {
      pill.addEventListener('click', () => {
        langPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        window.learnController?.setLanguage(pill.getAttribute('data-lang'));
      });
    });

    document.getElementById('quizNextBtn')?.addEventListener('click', () => {
      window.learnController?.nextQuestion();
    });
  }

  // --- Profile & Settings ---
  bindProfile() {
    const keyInput = document.getElementById('geminiApiKeyInput');
    if (keyInput) {
      keyInput.value = window.geminiService?.getApiKey() || '';
    }

    document.getElementById('toggleApiKeyVisibilityBtn')?.addEventListener('click', () => {
      if (keyInput) {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      }
    });

    document.getElementById('saveApiKeyBtn')?.addEventListener('click', () => {
      const key = keyInput?.value?.trim() || '';
      window.geminiService?.setApiKey(key);
      this.updateApiStatusIndicator();
      this.showToast(key ? "Gemini API Key saved locally" : "Gemini API Key removed. Using local engine.", "success");
    });

    document.getElementById('testApiKeyBtn')?.addEventListener('click', async () => {
      const key = keyInput?.value?.trim();
      const statusMsg = document.getElementById('apiKeyStatusMsg');
      if (statusMsg) {
        statusMsg.style.color = 'var(--accent-secondary)';
        statusMsg.textContent = 'Testing connection...';
      }

      try {
        await window.geminiService?.testConnection(key);
        if (statusMsg) {
          statusMsg.style.color = 'var(--color-success)';
          statusMsg.textContent = '✓ Connected to Gemini 1.5 Flash!';
        }
        this.showToast("Connection to Gemini API verified!", "success");
      } catch (e) {
        if (statusMsg) {
          statusMsg.style.color = 'var(--color-error)';
          statusMsg.textContent = `✗ Error: ${e.message}`;
        }
        this.showToast("Connection test failed: " + e.message, "error");
      }
    });

    document.getElementById('copyGradleCmdBtn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText("cd android && ./gradlew assembleDebug");
        this.showToast("Copied Gradle build command!", "success");
      } catch (e) {
        this.showToast("cd android && ./gradlew assembleDebug", "info");
      }
    });

    document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
      const history = window.historyManager?.getAll() || [];
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debugx_history_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast("History exported as JSON file", "success");
    });

    document.getElementById('resetAllDataBtn')?.addEventListener('click', () => {
      if (confirm("Reset all DebugX local storage data? This cannot be undone.")) {
        localStorage.clear();
        this.showToast("All local data reset. Reloading...", "info");
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }

  updateApiStatusIndicator() {
    const textEl = document.getElementById('apiStatusText');
    const hasKey = window.geminiService?.hasApiKey();
    if (textEl) {
      textEl.textContent = hasKey
        ? 'Gemini 1.5 Flash (Live Key Active)'
        : 'Gemini Ready (Demo + Intelligent Engine)';
    }
  }

  // --- Device Frame Switcher (Mobile vs Full-Width Responsive) ---
  bindDeviceFrameToggle() {
    const frame = document.getElementById('deviceFrame');
    const mobileBtn = document.getElementById('viewMobileBtn');
    const respBtn = document.getElementById('viewResponsiveBtn');

    mobileBtn?.addEventListener('click', () => {
      mobileBtn.classList.add('active');
      respBtn?.classList.remove('active');
      frame?.classList.remove('frame-responsive');
      frame?.classList.add('frame-mobile');
    });

    respBtn?.addEventListener('click', () => {
      respBtn.classList.add('active');
      mobileBtn?.classList.remove('active');
      frame?.classList.remove('frame-mobile');
      frame?.classList.add('frame-responsive');
    });
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  escapeJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  window.appController.init();
});
