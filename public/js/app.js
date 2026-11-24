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
    this.initAuth();
    this.bindNavigation();
    this.bindCamera();
    this.bindExplain();
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

  // --- Authentication & User Session Lifecycle ---
  initAuth() {
    if (!window.authManager) return;

    window.authManager.init();

    window.authManager.onAuthStateChanged((state, user) => {
      const welcomeScreen = document.getElementById('screenWelcome');
      const bottomNav = document.querySelector('.android-bottom-nav');
      const gesturePill = document.querySelector('.android-nav-pill');
      const googleBtn = document.getElementById('btnGoogleSignIn');
      const googleSpinner = document.getElementById('googleBtnSpinner');
      const googleBtnText = document.getElementById('googleBtnText');
      const errorBanner = document.getElementById('authErrorBanner');
      const errorText = document.getElementById('authErrorText');

      if (state === 'authenticating') {
        if (googleSpinner) googleSpinner.style.display = 'inline-block';
        if (googleBtnText) googleBtnText.textContent = 'Connecting with Google...';
        if (googleBtn) googleBtn.disabled = true;
        if (errorBanner) errorBanner.style.display = 'none';
      } else if (state === 'authenticated' && user) {
        if (googleSpinner) googleSpinner.style.display = 'none';
        if (googleBtnText) googleBtnText.textContent = 'Continue with Google';
        if (googleBtn) googleBtn.disabled = false;
        if (errorBanner) errorBanner.style.display = 'none';

        // Hide welcome screen & reveal full app navigation
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'flex';
        if (gesturePill) gesturePill.style.display = 'block';

        // Update User Profile details across the dashboard
        this.updateUserInterface(user);

        // Automatically verify & initialize Gemini AI Logic
        window.debuggingRepository?.gemini?.verifyConnection();

        // Switch to dashboard if was on welcome
        if (this.currentScreen === 'screenWelcome' || !this.currentScreen) {
          this.switchScreen('screenHome');
        }
      } else if (state === 'error') {
        if (googleSpinner) googleSpinner.style.display = 'none';
        if (googleBtnText) googleBtnText.textContent = 'Continue with Google';
        if (googleBtn) googleBtn.disabled = false;
        if (errorBanner) {
          errorBanner.style.display = 'flex';
          if (errorText && user?.message) errorText.textContent = user.message;
        }
      } else {
        // Unauthenticated
        if (googleSpinner) googleSpinner.style.display = 'none';
        if (googleBtnText) googleBtnText.textContent = 'Continue with Google';
        if (googleBtn) googleBtn.disabled = false;

        if (welcomeScreen) welcomeScreen.style.display = 'flex';
        if (bottomNav) bottomNav.style.display = 'none';
        if (gesturePill) gesturePill.style.display = 'none';

        const screens = document.querySelectorAll('.app-screen');
        screens.forEach(s => s.classList.remove('active'));
        if (welcomeScreen) welcomeScreen.classList.add('active');
        this.currentScreen = 'screenWelcome';
      }
    });

    // Google Sign-In Action
    document.getElementById('btnGoogleSignIn')?.addEventListener('click', async () => {
      try {
        await window.authManager.signInWithGoogle();
        this.showToast("Google account authenticated!", "success");
      } catch (err) {
        console.warn("Sign-in issue handled by listener:", err);
      }
    });

    // Sign Out Action
    document.getElementById('btnSignOut')?.addEventListener('click', async () => {
      await window.authManager.signOut();
      this.showToast("Signed out successfully", "info");
    });

    // Delete Account Actions
    document.getElementById('btnDeleteAccount')?.addEventListener('click', () => {
      const modal = document.getElementById('deleteAccountModal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('cancelDeleteAccountBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('deleteAccountModal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('confirmDeleteAccountBtn')?.addEventListener('click', async () => {
      const modal = document.getElementById('deleteAccountModal');
      if (modal) modal.style.display = 'none';
      await window.authManager.deleteAccount();
      this.showToast("Account and debugging records permanently deleted", "info");
    });

    // Legal Modals
    document.getElementById('linkPrivacyPolicy')?.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('privacyModal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('closePrivacyModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('privacyModal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('linkTermsOfService')?.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('termsModal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('closeTermsModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('termsModal');
      if (modal) modal.style.display = 'none';
    });
  }

  updateUserInterface(user) {
    if (!user) return;
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('homeAvatar');
    const headerGreeting = document.querySelector('.header-subtitle');

    if (nameEl) nameEl.textContent = user.displayName || 'Developer';
    if (emailEl) emailEl.textContent = user.email || 'developer@debugx.ai';
    if (headerGreeting) headerGreeting.textContent = `Welcome back, ${user.displayName ? user.displayName.split(' ')[0] : 'Developer'}`;

    if (avatarEl) {
      if (user.photoURL && user.photoURL.startsWith('http')) {
        avatarEl.innerHTML = `<img src="${this.escapeHtml(user.photoURL)}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        const initials = (user.displayName || 'DX').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }
    }
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

    document.getElementById('quickActionExplain')?.addEventListener('click', () => {
      this.switchScreen('screenExplain');
      this.ensureExplainLoaded();
    });

    document.getElementById('explainBackBtn')?.addEventListener('click', () => {
      this.switchScreen('screenHome');
    });

    document.getElementById('explainQuickSampleBtn')?.addEventListener('click', () => {
      this.loadExplainPreset('binary_search');
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

      // Automatically persist to history and Cloud Firestore
      window.historyManager?.saveSession(result);
      window.authManager?.saveDebuggingSession(result);

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
        window.authManager?.saveDebuggingSession(this.currentSession);
        this.showToast("Analysis saved to History & Cloud Firestore!", "success");
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

  // --- Profile & AI Configuration Management ---
  bindProfile() {
    // Retry / Test AI connection
    document.getElementById('retryAiConnectionBtn')?.addEventListener('click', async () => {
      const msgEl = document.getElementById('aiVerificationMsg');
      const latencyEl = document.getElementById('aiConfigLatency');
      if (msgEl) {
        msgEl.style.color = '#7957FF';
        msgEl.textContent = 'Verifying AI engine connection...';
      }

      try {
        const result = await window.debuggingRepository?.gemini?.verifyConnection();
        if (result && result.success) {
          if (msgEl) {
            msgEl.style.color = '#22C55E';
            msgEl.textContent = `✓ Verified • Ping: ${result.latency}ms`;
          }
          if (latencyEl) latencyEl.textContent = `~${result.latency}ms`;
          this.showToast(`Firebase AI Logic verified (${result.latency}ms)`, "success");
        } else {
          if (msgEl) {
            msgEl.style.color = '#EF4444';
            msgEl.textContent = `✗ ${result?.error || 'Connection check failed'}`;
          }
          this.showToast("AI connection check returned an error", "error");
        }
      } catch (err) {
        if (msgEl) {
          msgEl.style.color = '#EF4444';
          msgEl.textContent = `✗ ${err.message}`;
        }
        this.showToast("Connection failed: " + err.message, "error");
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
    const dotEl = document.querySelector('.indicator-dot');
    const aiConfigStatus = document.getElementById('aiConfigStatusText');
    const aiConfigDot = document.getElementById('aiConfigDot');

    window.debuggingRepository?.gemini?.onStatusChange((status, details) => {
      if (status === 'connected') {
        if (textEl) textEl.textContent = `AI ENGINE • CONNECTED (${details.latency || 95}ms)`;
        if (dotEl) { dotEl.style.background = '#22C55E'; dotEl.style.boxShadow = '0 0 8px #22C55E'; }
        if (aiConfigStatus) aiConfigStatus.textContent = `Connected & Verified (${details.latency || 95}ms)`;
        if (aiConfigDot) { aiConfigDot.className = 'ai-engine-dot'; aiConfigDot.style.background = '#22C55E'; }
      } else if (status === 'connecting') {
        if (textEl) textEl.textContent = 'AI ENGINE • INITIALIZING...';
        if (dotEl) { dotEl.style.background = '#F59E0B'; dotEl.style.boxShadow = '0 0 8px #F59E0B'; }
        if (aiConfigStatus) aiConfigStatus.textContent = 'Connecting to Firebase AI Logic...';
        if (aiConfigDot) { aiConfigDot.className = 'ai-engine-dot connecting'; }
      } else if (status === 'quota_exceeded') {
        if (textEl) textEl.textContent = 'AI ENGINE • QUOTA EXCEEDED';
        if (dotEl) { dotEl.style.background = '#EF4444'; dotEl.style.boxShadow = '0 0 8px #EF4444'; }
        if (aiConfigStatus) aiConfigStatus.textContent = 'Quota Exceeded (Check Billing)';
        if (aiConfigDot) { aiConfigDot.className = 'ai-engine-dot offline'; }
      } else {
        if (textEl) textEl.textContent = 'AI ENGINE • RESILIENT MODE';
        if (dotEl) { dotEl.style.background = '#38BDF8'; dotEl.style.boxShadow = '0 0 8px #38BDF8'; }
        if (aiConfigStatus) aiConfigStatus.textContent = 'Active (Intelligent Engine)';
        if (aiConfigDot) { aiConfigDot.className = 'ai-engine-dot'; aiConfigDot.style.background = '#38BDF8'; }
      }
    });
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

  // =========================================================================
  // FEATURE 3: EXPLAIN MY CODE — CONTROLLER & INTERACTION ENGINE
  // =========================================================================
  bindExplain() {
    this.currentExplainMode = 'beginner';
    this.currentExplainData = null;
    this.isInteractiveOverlay = false;
    this.selectedExplainLine = 1;
    this.selectedExplainVariable = null;

    const textarea = document.getElementById('explainCodeTextarea');
    const gutter = document.getElementById('explainEditorGutter');
    const langSelect = document.getElementById('explainLangSelect');
    const presetSelect = document.getElementById('explainPresetSelect');
    const uploadTrigger = document.getElementById('explainUploadTriggerBtn');
    const fileInput = document.getElementById('explainFileInput');
    const clearBtn = document.getElementById('explainClearCodeBtn');
    const toggleViewBtn = document.getElementById('explainToggleEditViewBtn');
    const runBtn = document.getElementById('runExplainBtn');

    // Gutter update on typing
    textarea?.addEventListener('input', () => {
      this.updateExplainLineNumbers();
      this.autoDetectLanguage(textarea.value);
    });

    textarea?.addEventListener('scroll', () => {
      if (gutter) gutter.scrollTop = textarea.scrollTop;
    });

    // Initial line numbers
    this.updateExplainLineNumbers();

    // Mode Toggle
    const modePills = document.querySelectorAll('.explain-mode-pill');
    modePills.forEach(pill => {
      pill.addEventListener('click', () => {
        modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentExplainMode = pill.getAttribute('data-mode') || 'beginner';
        if (this.currentExplainData) {
          this.executeExplainCode();
        }
      });
    });

    // Language Select
    langSelect?.addEventListener('change', () => {
      const tag = document.getElementById('explainDetectedLangTag');
      if (tag) tag.textContent = langSelect.options[langSelect.selectedIndex].text;
    });

    // Presets Select
    presetSelect?.addEventListener('change', () => {
      const val = presetSelect.value;
      if (val) this.loadExplainPreset(val);
    });

    // File Upload
    uploadTrigger?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (textarea) textarea.value = text;
        this.updateExplainLineNumbers();
        
        // Infer language from extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        const extMap = {
          py: 'python', js: 'javascript', ts: 'typescript', kt: 'kotlin',
          java: 'java', cpp: 'cpp', c: 'cpp', go: 'go', rs: 'rust', cs: 'csharp'
        };
        if (extMap[ext] && langSelect) {
          langSelect.value = extMap[ext];
          const tag = document.getElementById('explainDetectedLangTag');
          if (tag) tag.textContent = langSelect.options[langSelect.selectedIndex].text;
        } else {
          this.autoDetectLanguage(text);
        }

        const label = document.getElementById('explainEditorLabel');
        if (label) label.textContent = file.name;

        this.showToast(`Loaded ${file.name}`, 'success');
        this.executeExplainCode(file.name);
      };
      reader.readAsText(file);
    });

    // Clear Code
    clearBtn?.addEventListener('click', () => {
      if (textarea) textarea.value = '';
      this.updateExplainLineNumbers();
      this.currentExplainData = null;
      this.showToast('Code cleared', 'info');
    });

    // Toggle Edit Mode vs Interactive View
    toggleViewBtn?.addEventListener('click', () => {
      this.toggleExplainInteractiveView();
    });

    // Run Explain Button
    runBtn?.addEventListener('click', () => {
      this.executeExplainCode();
    });

    // Right Pane Subtabs Switching
    const subtabs = document.querySelectorAll('#explainSubTabs .subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = btn.getAttribute('data-tab');
        const panels = document.querySelectorAll('.explain-tab-panel');
        panels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(targetTab);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    // Ask AI Follow-Up Form
    const askForm = document.getElementById('explainAskAiForm');
    const askInput = document.getElementById('explainAskAiInput');
    askForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = askInput?.value?.trim();
      if (q) {
        this.sendExplainAskAi(q);
        if (askInput) askInput.value = '';
      }
    });

    // Quick Question Chips
    const quickChips = document.querySelectorAll('.explain-quick-questions .quick-chip');
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-q');
        if (q) this.sendExplainAskAi(q);
      });
    });

    // Auto-run default sample explanation on startup
    setTimeout(() => {
      if (textarea && textarea.value) {
        this.executeExplainCode();
      }
    }, 400);
  }

  updateExplainLineNumbers() {
    const textarea = document.getElementById('explainCodeTextarea');
    const gutter = document.getElementById('explainEditorGutter');
    if (!textarea || !gutter) return;

    const lines = (textarea.value || '').split('\n').length;
    let gutterHtml = '';
    for (let i = 1; i <= Math.max(lines, 1); i++) {
      gutterHtml += `<div>${i}</div>`;
    }
    gutter.innerHTML = gutterHtml;
  }

  autoDetectLanguage(code) {
    if (!code) return;
    const langSelect = document.getElementById('explainLangSelect');
    const tag = document.getElementById('explainDetectedLangTag');
    if (langSelect && langSelect.value !== 'auto') {
      if (tag) tag.textContent = langSelect.options[langSelect.selectedIndex].text;
      return;
    }

    const t = code.toLowerCase();
    let detected = 'Python';
    if (t.includes('fun ') || t.includes('val ') || t.includes('var ') && t.includes(': string')) detected = 'Kotlin';
    else if (t.includes('function') || t.includes('const ') || t.includes('console.log') || t.includes('=>')) detected = 'JavaScript';
    else if (t.includes('public class') || t.includes('system.out.println')) detected = 'Java';
    else if (t.includes('#include') || t.includes('std::cout')) detected = 'C++';
    else if (t.includes('package main') || t.includes('func ')) detected = 'Go';
    else if (t.includes('fn main') || t.includes('let mut')) detected = 'Rust';
    else if (t.includes('def ') || t.includes('print(') || t.includes('elif ')) detected = 'Python';

    if (tag) tag.textContent = detected;
  }

  ensureExplainLoaded() {
    const textarea = document.getElementById('explainCodeTextarea');
    if (!this.currentExplainData && textarea && textarea.value) {
      this.executeExplainCode();
    }
  }

  loadExplainPreset(presetKey) {
    const textarea = document.getElementById('explainCodeTextarea');
    const langSelect = document.getElementById('explainLangSelect');
    const tag = document.getElementById('explainDetectedLangTag');

    const presets = {
      binary_search: {
        lang: 'python',
        display: 'Python',
        code: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`
      },
      fibonacci: {
        lang: 'javascript',
        display: 'JavaScript',
        code: `function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`
      },
      palindrome: {
        lang: 'kotlin',
        display: 'Kotlin',
        code: `fun isPalindrome(s: String): Boolean {
    var left = 0
    var right = s.length - 1
    while (left < right) {
        if (s[left] != s[right]) return false
        left++
        right--
    }
    return true
}`
      },
      twosum: {
        lang: 'cpp',
        display: 'C++',
        code: `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`
      }
    };

    const preset = presets[presetKey] || presets.binary_search;
    if (textarea) textarea.value = preset.code;
    if (langSelect) langSelect.value = preset.lang;
    if (tag) tag.textContent = preset.display;

    this.updateExplainLineNumbers();
    this.executeExplainCode();
    this.showToast(`Loaded ${preset.display} preset`, 'success');
  }

  toggleExplainInteractiveView() {
    const textarea = document.getElementById('explainCodeTextarea');
    const overlay = document.getElementById('explainInteractiveOverlay');
    const btnText = document.getElementById('explainEditBtnText');

    this.isInteractiveOverlay = !this.isInteractiveOverlay;

    if (this.isInteractiveOverlay) {
      if (textarea) textarea.style.display = 'none';
      if (overlay) overlay.style.display = 'block';
      if (btnText) btnText.textContent = 'Edit Code';
      this.renderInteractiveLines();
    } else {
      if (textarea) textarea.style.display = 'block';
      if (overlay) overlay.style.display = 'none';
      if (btnText) btnText.textContent = 'Interactive View';
    }
  }

  renderInteractiveLines() {
    const textarea = document.getElementById('explainCodeTextarea');
    const overlay = document.getElementById('explainInteractiveOverlay');
    if (!textarea || !overlay) return;

    const lines = (textarea.value || '').split('\n');
    let html = '';

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const isSelected = this.selectedExplainLine === lineNum;
      const hasVariable = this.selectedExplainVariable && lineText.includes(this.selectedExplainVariable);

      let classes = ['code-line-row'];
      if (isSelected) classes.push('selected');
      if (hasVariable) classes.push('has-variable');

      let highlighted = this.escapeHtml(lineText);
      if (this.selectedExplainVariable) {
        const escapedVar = this.escapeHtml(this.selectedExplainVariable);
        const re = new RegExp(`\\b(${escapedVar})\\b`, 'g');
        highlighted = highlighted.replace(re, `<span class="var-token">$1</span>`);
      }

      html += `<div class="${classes.join(' ')}" data-line="${lineNum}">` +
        `<span style="color: #64748b; width: 28px; display: inline-block; user-select: none;">${lineNum}</span> ` +
        `<span>${highlighted || '&nbsp;'}</span>` +
        `</div>`;
    });

    overlay.innerHTML = html;

    // Attach click handlers to lines
    overlay.querySelectorAll('.code-line-row').forEach(row => {
      row.addEventListener('click', () => {
        const line = parseInt(row.getAttribute('data-line') || '1', 10);
        this.selectExplainLine(line);
      });
    });
  }

  selectExplainLine(lineNum) {
    this.selectedExplainLine = lineNum;

    // Update overlay active row
    const overlay = document.getElementById('explainInteractiveOverlay');
    if (overlay) {
      overlay.querySelectorAll('.code-line-row').forEach(r => {
        if (parseInt(r.getAttribute('data-line') || '0', 10) === lineNum) {
          r.classList.add('selected');
        } else {
          r.classList.remove('selected');
        }
      });
    }

    // Switch right pane to Line-by-Line tab and highlight/scroll to card
    const subtabs = document.querySelectorAll('#explainSubTabs .subtab-btn');
    subtabs.forEach(b => {
      if (b.getAttribute('data-tab') === 'tabLineByLine') b.classList.add('active');
      else b.classList.remove('active');
    });

    const panels = document.querySelectorAll('.explain-tab-panel');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById('tabLineByLine')?.classList.add('active');

    const cards = document.querySelectorAll('.line-card');
    cards.forEach(card => {
      if (parseInt(card.getAttribute('data-line') || '0', 10) === lineNum) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('active');
      }
    });
  }

  selectExplainVariable(varName) {
    if (this.selectedExplainVariable === varName) {
      this.selectedExplainVariable = null;
    } else {
      this.selectedExplainVariable = varName;
    }

    // Re-render interactive lines
    if (this.isInteractiveOverlay) {
      this.renderInteractiveLines();
    }

    // Highlight variable card
    const cards = document.querySelectorAll('.variable-card');
    cards.forEach(card => {
      if (card.getAttribute('data-var') === this.selectedExplainVariable) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  async executeExplainCode(fileName = '') {
    const textarea = document.getElementById('explainCodeTextarea');
    const runBtn = document.getElementById('runExplainBtn');
    const langSelect = document.getElementById('explainLangSelect');

    const code = textarea?.value?.trim();
    if (!code) {
      this.showToast('Please enter or upload code to explain.', 'warning');
      return;
    }

    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = `<span class="loading-spinner"></span> <span>Analyzing code with Gemini...</span>`;
    }

    try {
      const language = langSelect?.value || 'auto';
      const result = await window.geminiService.explainCode({
        code,
        language,
        mode: this.currentExplainMode,
        fileName
      });

      this.currentExplainData = result;
      this.renderExplainResult(result);
      this.showToast('Code explained successfully!', 'success');
    } catch (err) {
      console.error("Explain error:", err);
      this.showToast(err.message || 'Failed to explain code', 'error');
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <span>Explain My Code</span>`;
      }
    }
  }

  renderExplainResult(data) {
    // 1. Complexity Badges
    const timeBadge = document.getElementById('badgeTimeComplexity');
    const spaceBadge = document.getElementById('badgeSpaceComplexity');
    const detailTimeVal = document.getElementById('detailTimeVal');
    const detailTimeReasoning = document.getElementById('detailTimeReasoning');
    const detailSpaceVal = document.getElementById('detailSpaceVal');
    const detailSpaceReasoning = document.getElementById('detailSpaceReasoning');

    if (timeBadge) timeBadge.textContent = `Time: ${data.complexity?.time || 'O(n)'}`;
    if (spaceBadge) spaceBadge.textContent = `Space: ${data.complexity?.space || 'O(1)'}`;
    if (detailTimeVal) detailTimeVal.textContent = data.complexity?.time || 'O(n)';
    if (detailTimeReasoning) detailTimeReasoning.textContent = data.complexity?.time_reasoning || 'Linear traversal.';
    if (detailSpaceVal) detailSpaceVal.textContent = data.complexity?.space || 'O(1)';
    if (detailSpaceReasoning) detailSpaceReasoning.textContent = data.complexity?.space_reasoning || 'Constant memory.';

    // 2. Line-by-Line Cards
    const lineCardsList = document.getElementById('explainLineCardsList');
    if (lineCardsList) {
      let html = '';
      (data.line_explanations || []).forEach(item => {
        const isSelected = item.line === this.selectedExplainLine;
        html += `
          <div class="line-card ${isSelected ? 'active' : ''}" data-line="${item.line}">
            <div class="line-card-header">
              <span class="line-pill">Line ${item.line}</span>
              <span class="line-role">${this.escapeHtml(item.role || 'Statement')}</span>
            </div>
            <div class="line-code-snippet">${this.escapeHtml(item.code || '')}</div>
            <p class="line-explanation-text">${this.escapeHtml(item.explanation || '')}</p>
            ${item.beginner_analogy ? `
              <div class="beginner-analogy-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                <span>${this.escapeHtml(item.beginner_analogy)}</span>
              </div>
            ` : ''}
          </div>
        `;
      });
      lineCardsList.innerHTML = html;

      // Attach click handlers to line cards
      lineCardsList.querySelectorAll('.line-card').forEach(card => {
        card.addEventListener('click', () => {
          const l = parseInt(card.getAttribute('data-line') || '1', 10);
          this.selectExplainLine(l);
        });
      });
    }

    // 3. Variables & Scope
    const varGrid = document.getElementById('explainVariablesGrid');
    if (varGrid) {
      let html = '';
      (data.variables || []).forEach(v => {
        html += `
          <div class="variable-card" data-var="${this.escapeHtml(v.name)}">
            <div class="variable-card-top">
              <span class="var-name">${this.escapeHtml(v.name)}</span>
              <div class="var-badges">
                <span class="var-badge">${this.escapeHtml(v.type || 'Inferred')}</span>
                <span class="var-badge">${this.escapeHtml(v.scope || 'Local')}</span>
              </div>
            </div>
            <p class="var-desc">${this.escapeHtml(v.purpose || '')}</p>
            <div class="var-lines">Declared at line ${v.declared_line || 1}${v.used_lines?.length ? ` • Used on lines: ${v.used_lines.join(', ')}` : ''}</div>
          </div>
        `;
      });
      varGrid.innerHTML = html;

      varGrid.querySelectorAll('.variable-card').forEach(card => {
        card.addEventListener('click', () => {
          const name = card.getAttribute('data-var');
          if (name) this.selectExplainVariable(name);
        });
      });
    }

    // 4. Visualizers (Loop & Function)
    const loopTableWrapper = document.getElementById('loopTraceTableWrapper');
    const loopBadge = document.getElementById('loopIterationBadge');
    if (loopTableWrapper) {
      const iters = data.loop_visualizer || [];
      if (loopBadge) loopBadge.textContent = `${iters.length} Iterations`;

      if (!iters.length) {
        loopTableWrapper.innerHTML = `<p style="font-size: 0.74rem; color: #64748b; margin: 4px 0;">No iterative loops detected in this code snippet.</p>`;
      } else {
        const keys = Object.keys(iters[0]?.variables_state || {});
        let ths = `<th>Iter</th>`;
        keys.forEach(k => ths += `<th>${this.escapeHtml(k)}</th>`);
        ths += `<th>Explanation</th>`;

        let rows = '';
        iters.forEach(it => {
          let tds = `<td>#${it.iteration}</td>`;
          keys.forEach(k => {
            tds += `<td>${this.escapeHtml(it.variables_state?.[k] || '-')}</td>`;
          });
          tds += `<td>${this.escapeHtml(it.explanation || '')}</td>`;
          rows += `<tr>${tds}</tr>`;
        });

        loopTableWrapper.innerHTML = `
          <table class="loop-trace-table">
            <thead><tr>${ths}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }
    }

    const funcFramesList = document.getElementById('functionFramesList');
    if (funcFramesList) {
      let html = '';
      (data.function_visualizer || []).forEach(f => {
        html += `
          <div class="function-frame-item">
            <div class="function-frame-top">
              <span>Frame #${f.frame}: ${this.escapeHtml(f.function_name)}()</span>
              <span style="color: #22c55e;">${this.escapeHtml(f.status || 'Active')}</span>
            </div>
            <div class="function-frame-args">Args: ${this.escapeHtml(JSON.stringify(f.arguments || {}))}</div>
            <div class="function-frame-ret">Return: ${this.escapeHtml(f.return_value || 'void')}</div>
          </div>
        `;
      });
      funcFramesList.innerHTML = html || `<p style="font-size: 0.74rem; color: #64748b;">No call stack transitions to display.</p>`;
    }

    // 5. Control Structures
    const structuresList = document.getElementById('explainStructuresList');
    if (structuresList) {
      let html = '';
      (data.control_structures || []).forEach(cs => {
        html += `
          <div class="structure-item">
            <div class="structure-title-row">
              <span class="structure-type">${this.escapeHtml(cs.type)} (Lines ${this.escapeHtml(cs.line_range)})</span>
              <span style="font-size: 0.7rem; color: #94a3b8;">${this.escapeHtml(cs.condition || 'Sequential')}</span>
            </div>
            <p style="font-size: 0.76rem; color: #f1f5f9; margin: 4px 0;">${this.escapeHtml(cs.explanation || '')}</p>
            <div style="font-size: 0.7rem; color: #64748b;">Termination: ${this.escapeHtml(cs.termination || 'Block completion')}</div>
          </div>
        `;
      });
      structuresList.innerHTML = html || `<p style="font-size: 0.74rem; color: #64748b;">Sequential execution block.</p>`;
    }

    // 6. Bugs & Improvements
    const bugsList = document.getElementById('explainBugsList');
    if (bugsList) {
      let html = '';
      (data.bugs_and_improvements || []).forEach(b => {
        html += `
          <div class="bug-item">
            <div class="bug-title-row">
              <span class="bug-type">${this.escapeHtml(b.type)} (Line ${b.line || 1})</span>
              <span style="font-size: 0.68rem; color: #f59e0b; font-weight: 700;">${this.escapeHtml(b.severity || 'Notice')}</span>
            </div>
            <p style="font-size: 0.76rem; color: #f1f5f9; margin: 4px 0;">${this.escapeHtml(b.issue || '')}</p>
            ${b.fix ? `<div class="bug-fix-box">Fix: ${this.escapeHtml(b.fix)}</div>` : ''}
          </div>
        `;
      });
      bugsList.innerHTML = html || `<p style="font-size: 0.74rem; color: #22c55e;">No major bugs or vulnerabilities detected.</p>`;
    }

    // 7. Execution Flow Stepper
    const flowStepper = document.getElementById('executionFlowStepper');
    if (flowStepper) {
      let html = '';
      (data.execution_flow || []).forEach(step => {
        html += `
          <div class="flow-step-item">
            <div class="flow-step-num">${step.step}</div>
            <div class="flow-step-text">
              <strong style="color: #c084fc;">Line ${step.line}:</strong> ${this.escapeHtml(step.description)}
            </div>
          </div>
        `;
      });
      flowStepper.innerHTML = html;
    }

    // 8. Predicted Output & Disclaimer
    const consoleOutput = document.getElementById('predictedConsoleOutput');
    const reasoningText = document.getElementById('predictedReasoningText');
    const noticeBox = document.getElementById('predictionNoticeBox');

    if (consoleOutput) {
      consoleOutput.innerHTML = `<span class="console-cursor">></span> ${this.escapeHtml(data.predicted_output?.output_text || 'Completed execution.')}`;
    }
    if (reasoningText) {
      reasoningText.textContent = data.predicted_output?.reasoning || 'Statically analyzed.';
    }
    if (noticeBox) {
      noticeBox.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${this.escapeHtml(data.predicted_output?.execution_notice || 'Statically predicted via AST simulation. Not run in a live sandboxed runtime.')}</span>
      `;
    }
  }

  async sendExplainAskAi(question) {
    const thread = document.getElementById('explainAskAiThread');
    if (!thread) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'ask-ai-msg user';
    userMsg.innerHTML = `<div class="msg-bubble">${this.escapeHtml(question)}</div>`;
    thread.appendChild(userMsg);
    thread.scrollTop = thread.scrollHeight;

    // Bot typing placeholder
    const botMsg = document.createElement('div');
    botMsg.className = 'ask-ai-msg bot';
    botMsg.innerHTML = `<div class="bot-avatar">AI</div><div class="msg-bubble"><span class="typing-dots">Thinking...</span></div>`;
    thread.appendChild(botMsg);
    thread.scrollTop = thread.scrollHeight;

    try {
      const textarea = document.getElementById('explainCodeTextarea');
      const code = textarea?.value || '';
      const reply = await window.geminiService.askExplainFollowUp({
        code,
        context: this.currentExplainData,
        question
      });

      botMsg.querySelector('.msg-bubble').innerHTML = this.escapeHtml(reply).replace(/\n/g, '<br>');
    } catch (e) {
      botMsg.querySelector('.msg-bubble').textContent = "I'm having trouble analyzing this right now. Please try again.";
    }
    thread.scrollTop = thread.scrollHeight;
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
