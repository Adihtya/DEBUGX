/**
 * DEBUGX — Learning Centre Controller
 * Section 12: Handles Error Library, Interactive Challenges, and Practice Quizzes
 */

class LearnController {
  constructor() {
    this.currentLanguage = 'python';
    this.quizIndex = 0;
    this.quizScore = 0;
  }

  init() {
    this.renderErrorCards(this.currentLanguage);
    this.renderChallenges();
    this.renderQuizQuestion();
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    this.renderErrorCards(lang);
  }

  renderErrorCards(lang) {
    const container = document.getElementById('errorCardsContainer');
    if (!container) return;

    const list = LEARN_ERROR_LIBRARY[lang] || [];
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No common errors recorded for this language yet.</p></div>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="error-card-item">
        <div class="error-card-header">
          <span class="error-card-title">${this.escapeHtml(item.title)}</span>
          <span class="badge-difficulty ${item.difficulty}">${item.difficulty}</span>
        </div>
        <p class="error-card-desc">${this.escapeHtml(item.desc)}</p>
        <div class="error-code-preview">
          <code>${this.escapeHtml(item.code)}</code>
        </div>
        <div class="card-section-header" style="margin-top: 4px;">
          <span class="section-subtitle">Recommended Fix:</span>
          <button class="btn btn-sm btn-outline btn-try-fix" onclick="learnController.loadIntoWorkspace('${this.escapeJs(item.code)}', '${lang}')">
            Test in Workspace →
          </button>
        </div>
        <div class="error-code-preview" style="border-left: 2px solid var(--color-success);">
          <code style="color: #86EFAC;">${this.escapeHtml(item.fix)}</code>
        </div>
        <div class="concepts-tags-row">
          ${item.concepts.map(c => `<span class="concept-chip">${this.escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  renderChallenges() {
    const container = document.getElementById('challengesContainer');
    if (!container) return;

    const challenges = [
      {
        title: "Challenge 1: The Off-By-One Loop",
        lang: "Python",
        difficulty: "Beginner",
        instructions: "The function below is supposed to calculate factorials, but raises an unexpected RecursionError or returns 0. Fix the loop boundary.",
        buggyCode: "def factorial(n):\n    result = 1\n    for i in range(1, n):  # Missing n in range!\n        result *= i\n    return result",
        hint: "In Python, range(start, stop) excludes the stop value! To include n, use range(1, n + 1).",
        solution: "def factorial(n):\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result"
      },
      {
        title: "Challenge 2: The Android Concurrent List Mutator",
        lang: "Kotlin",
        difficulty: "Intermediate",
        instructions: "Removing inactive task items while iterating through a MutableList throws ConcurrentModificationException. Fix with modern idiomatic Kotlin.",
        buggyCode: "fun cleanTasks(tasks: MutableList<Task>) {\n    for (t in tasks) {\n        if (!t.isActive) tasks.remove(t) // CRASH!\n    }\n}",
        hint: "Never mutate a list directly inside a standard for-in loop. Use 'tasks.removeAll { !it.isActive }'.",
        solution: "fun cleanTasks(tasks: MutableList<Task>) {\n    tasks.removeAll { !it.isActive }\n}"
      },
      {
        title: "Challenge 3: The Ghost State in React Hooks",
        lang: "JavaScript",
        difficulty: "Advanced",
        instructions: "Calling an async counter increment 3 times only increments the count by 1 instead of 3 due to stale closure state.",
        buggyCode: "const [count, setCount] = useState(0);\nconst handleAddThree = () => {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n};",
        hint: "When state depends on previous state, pass an updater function: setCount(prev => prev + 1).",
        solution: "const [count, setCount] = useState(0);\nconst handleAddThree = () => {\n    setCount(prev => prev + 1);\n    setCount(prev => prev + 1);\n    setCount(prev => prev + 1);\n};"
      }
    ];

    container.innerHTML = challenges.map((c, idx) => `
      <div class="result-card" style="margin-bottom: 12px;">
        <div class="card-section-header">
          <h4 class="card-title">${c.title}</h4>
          <span class="category-pill">${c.lang}</span>
        </div>
        <p class="explanation-text">${c.instructions}</p>
        <div class="code-viewer error-block">
          <pre class="code-pre"><code>${this.escapeHtml(c.buggyCode)}</code></pre>
        </div>
        <div id="solutionBox_${idx}" style="display: none; margin-top: 8px;">
          <div class="quiz-explanation-box">
            <strong>Hint:</strong> ${c.hint}
          </div>
          <div class="code-viewer success-block" style="margin-top: 8px;">
            <pre class="code-pre"><code style="color: #86EFAC;">${this.escapeHtml(c.solution)}</code></pre>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="btn btn-sm btn-secondary" onclick="learnController.toggleSolution(${idx})">
            Reveal Solution & Hint
          </button>
          <button class="btn btn-sm btn-outline" onclick="learnController.loadIntoWorkspace('${this.escapeJs(c.buggyCode)}', '${c.lang.toLowerCase()}')">
            Solve in Workspace →
          </button>
        </div>
      </div>
    `).join('');
  }

  toggleSolution(idx) {
    const el = document.getElementById(`solutionBox_${idx}`);
    if (el) {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  }

  loadIntoWorkspace(code, lang) {
    const textarea = document.getElementById('codeTextarea');
    const select = document.getElementById('codeLanguageSelect');
    if (textarea) textarea.value = code;
    if (select && lang) select.value = lang;

    // Trigger line number recalculation
    if (window.appController) {
      window.appController.updateLineNumbers();
      window.appController.switchScreen('screenDebug');
      window.appController.showToast("Loaded into Workspace!", "info");
    }
  }

  renderQuizQuestion() {
    const q = PRACTICE_QUIZ_QUESTIONS[this.quizIndex];
    if (!q) {
      // Quiz finished
      const card = document.getElementById('quizCard');
      if (card) {
        card.innerHTML = `
          <div class="empty-state">
            <div class="metric-value">${this.quizScore} / ${PRACTICE_QUIZ_QUESTIONS.length}</div>
            <h3 class="empty-title">Quiz Completed!</h3>
            <p class="empty-desc">Great job testing your senior debugging intuition.</p>
            <button class="btn btn-primary" onclick="learnController.restartQuiz()">Restart Quiz</button>
          </div>
        `;
      }
      return;
    }

    document.getElementById('quizDifficulty').textContent = q.difficulty;
    document.getElementById('quizCounter').textContent = `Question ${this.quizIndex + 1} of ${PRACTICE_QUIZ_QUESTIONS.length}`;
    document.getElementById('quizQuestion').textContent = q.question;
    document.getElementById('quizCode').textContent = q.code;

    const optionsContainer = document.getElementById('quizOptionsList');
    const explanationBox = document.getElementById('quizExplanation');
    const nextBtn = document.getElementById('quizNextBtn');

    explanationBox.style.display = 'none';
    nextBtn.style.display = 'none';

    optionsContainer.innerHTML = q.options.map((opt, i) => `
      <button class="quiz-option-btn" data-index="${i}" onclick="learnController.handleQuizAnswer(${i})">
        <span style="font-weight: 700; color: var(--accent-secondary);">${String.fromCharCode(65 + i)}.</span>
        <span>${this.escapeHtml(opt)}</span>
      </button>
    `).join('');
  }

  handleQuizAnswer(selectedIndex) {
    const q = PRACTICE_QUIZ_QUESTIONS[this.quizIndex];
    const buttons = document.querySelectorAll('.quiz-option-btn');
    const explanationBox = document.getElementById('quizExplanation');
    const nextBtn = document.getElementById('quizNextBtn');

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex) {
        btn.classList.add('wrong');
      }
    });

    if (selectedIndex === q.correctIndex) {
      this.quizScore++;
      explanationBox.innerHTML = `<strong>Correct!</strong> ${q.explanation}`;
    } else {
      explanationBox.innerHTML = `<strong>Incorrect.</strong> ${q.explanation}`;
    }

    explanationBox.style.display = 'block';
    nextBtn.style.display = 'block';
  }

  nextQuestion() {
    this.quizIndex++;
    this.renderQuizQuestion();
  }

  restartQuiz() {
    this.quizIndex = 0;
    this.quizScore = 0;
    // Re-render template if altered
    window.location.reload();
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

window.learnController = new LearnController();
