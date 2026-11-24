/**
 * DEBUGX — Sample Data & Knowledge Base
 * Adheres strictly to Section 14 (AI Response Structure) and Section 18 (Sample Demonstration)
 */

const DEBUGX_SAMPLE_DEMO = {
  is_sample: true,
  language: "Python",
  error_title: "IndexError: list index out of range",
  error_category: "Runtime Error",
  severity: "Medium",
  confidence: 0.95,
  problematic_lines: [2],
  summary: "The code is trying to access an element at index 5 from a list that only contains 3 elements.",
  root_cause: "Python lists use zero-based indexing. For a list with 3 elements (length 3), the valid indices are 0, 1, and 2. Attempting to access index 5 triggers an IndexError because it exceeds the list's memory bounds.",
  original_code: `numbers = [10, 20, 30]
print(numbers[5])`,
  corrected_code: `numbers = [10, 20, 30]

if len(numbers) > 5:
    print(numbers[5])
else:
    print("Index does not exist")`,
  explanation_beginner: [
    "Python lists start counting items from zero (0), not one (1).",
    "In your list [10, 20, 30], numbers[0] is 10, numbers[1] is 20, and numbers[2] is 30.",
    "Because there are only 3 items, index 5 does not exist. It's like asking for floor 5 in a 3-story building.",
    "The fix checks the length of the list using len() before trying to read index 5 to keep your program safe."
  ],
  explanation_advanced: [
    "List lookup numbers[i] performs a bounds check at the CPython bytecode level (BINARY_SUBSCR).",
    "When index 5 >= PyList_GET_SIZE(numbers), PyErr_SetString(PyExc_IndexError, 'list index out of range') is raised.",
    "The guard condition len(numbers) > 5 avoids the exception overhead. In high-throughput systems, defensive bounds checking is preferred over costly try/except unwinding.",
    "For dynamic sequences where missing elements have fallbacks, consider using a custom helper or dictionary mapping."
  ],
  prevention_tips: [
    "Always verify container length with len(seq) > index before direct index access.",
    "Iterate directly over elements using 'for num in numbers:' instead of indexing with range().",
    "Use enumerate() when you need both the element and its zero-based index.",
    "When fetching optional items, consider defensive try/except IndexError guards or helper functions."
  ],
  related_concepts: [
    "Zero-Based Indexing",
    "Sequence Bounds Checking",
    "Defensive Programming",
    "Exception Handling"
  ],
  needs_more_information: false
};

const DEBUGX_TIPS = [
  {
    title: "Isolate with Binary Search Debugging",
    body: "When diagnosing an unexpected state in a 1,000-line module, place a diagnostic log halfway. If the state is clean, the bug is downstream; if corrupt, it is upstream. You can pinpoint the exact line in fewer than 10 iterations."
  },
  {
    title: "Rubber Duck Debugging Works",
    body: "Explaining your code line by line to an inanimate object (or DebugX AI) forces your brain to shift from subconscious assumption to explicit verification. You will often spot the syntax or logical flaw mid-sentence."
  },
  {
    title: "Never Trust Silent Catch Blocks",
    body: "Empty catch blocks ('catch (Exception e) {}') swallow critical stack traces and lead to ghost bugs. Always log the exception type, message, and cause when debugging."
  },
  {
    title: "Check Mutability & References",
    body: "In Python and JavaScript, passing a list or object as a default function argument binds a single persistent reference across all invocations. Use 'target=None' and instantiate inside the function."
  },
  {
    title: "Reproduce in Isolation",
    body: "Before fixing a complex crash, extract the offending function into a minimal reproducible snippet (SSCCE). If you can't trigger the bug in 15 lines, you don't fully understand the preconditions."
  }
];

const INITIAL_HISTORY_ITEMS = [
  {
    id: "hist_sample_1",
    is_sample: true,
    language: "Python",
    error_title: "IndexError: list index out of range",
    error_category: "Runtime Error",
    severity: "Medium",
    confidence: 0.95,
    problematic_lines: [2],
    summary: "The code is trying to access an element that does not exist in a 3-item list.",
    root_cause: "Zero-based list bounds exceeded at index 5.",
    original_code: "numbers = [10, 20, 30]\nprint(numbers[5])",
    corrected_code: "numbers = [10, 20, 30]\n\nif len(numbers) > 5:\n    print(numbers[5])\nelse:\n    print(\"Index does not exist\")",
    explanation: [
      "The list starts at index 0.",
      "The requested index 5 is outside the available 3-item range."
    ],
    prevention_tips: ["Check list length before accessing elements with len()."],
    related_concepts: ["List indexing", "Array bounds", "Exception handling"],
    timestamp: "Today, 14:20",
    starred: true
  },
  {
    id: "hist_sample_2",
    is_sample: false,
    language: "Kotlin",
    error_title: "NullPointerException: Attempt to invoke virtual method on null object",
    error_category: "Null Safety",
    severity: "Critical",
    confidence: 0.98,
    problematic_lines: [14],
    summary: "Unsafe smart cast or force unwrapping (!!) on a nullable user profile repository call.",
    root_cause: "The userProfile variable was accessed using 'userProfile!!.displayName' before the network fetch completed.",
    original_code: "val userProfile: User? = userRepository.getUser()\nval name = userProfile!!.displayName",
    corrected_code: "val userProfile: User? = userRepository.getUser()\nval name = userProfile?.displayName ?: \"Guest Developer\"",
    explanation: [
      "Kotlin's double-bang (!!) operator forces unwrapping and defeats compile-time null safety.",
      "Using the safe-call operator (?.) paired with Elvis (?:) provides an elegant fallback."
    ],
    prevention_tips: ["Avoid the '!!' operator in production Kotlin.", "Use sealed UI states."],
    related_concepts: ["Null Safety", "Safe Call Operator", "Elvis Operator"],
    timestamp: "Yesterday, 19:45",
    starred: false
  },
  {
    id: "hist_sample_3",
    is_sample: false,
    language: "JavaScript",
    error_title: "TypeError: Cannot read properties of undefined (reading 'map')",
    error_category: "Type Error",
    severity: "High",
    confidence: 0.94,
    problematic_lines: [7],
    summary: "Attempting to invoke .map() on an asynchronous API payload before it finished resolving.",
    root_cause: "Component rendered initially with items initialized to undefined instead of an empty array [].",
    original_code: "const [items, setItems] = useState();\nreturn <div>{items.map(i => <span>{i.name}</span>)}</div>;",
    corrected_code: "const [items, setItems] = useState([]);\nreturn <div>{items?.map(i => <span key={i.id}>{i.name}</span>)}</div>;",
    explanation: [
      "Initial state was undefined, causing undefined.map() during initial paint.",
      "Defaulting useState([]) ensures map is always a callable array prototype."
    ],
    prevention_tips: ["Always supply safe initial state defaults in React hooks."],
    related_concepts: ["Optional Chaining", "React State Lifecycle", "Array Prototypes"],
    timestamp: "Nov 21, 11:10",
    starred: true
  }
];

const LEARN_ERROR_LIBRARY = {
  python: [
    {
      title: "IndexError: list index out of range",
      difficulty: "beginner",
      category: "Runtime Error",
      desc: "Triggered when an index refers to a sequence item that does not exist in memory.",
      code: "items = ['a', 'b']\nprint(items[2])  # Valid are 0 and 1",
      fix: "if len(items) > 2:\n    print(items[2])",
      concepts: ["0-based indexing", "Sequence bounds", "len() guard"]
    },
    {
      title: "KeyError: 'token'",
      difficulty: "beginner",
      category: "Dictionary Error",
      desc: "Raised when accessing a dictionary key that was not populated in the mapping.",
      code: "user = {'id': 1}\nprint(user['token'])",
      fix: "token = user.get('token', 'default_guest')",
      concepts: ["dict.get()", "Default fallbacks", "in operator"]
    },
    {
      title: "TypeError: unsupported operand type(s) for +",
      difficulty: "beginner",
      category: "Type Mismatch",
      desc: "Occurs when attempting to concatenate incompatible types, e.g. str and int without casting.",
      code: "age = 25\nmsg = 'Age: ' + age",
      fix: "msg = f'Age: {age}'",
      concepts: ["f-strings", "Type coercion", "str()"]
    },
    {
      title: "RecursionError: maximum recursion depth exceeded",
      difficulty: "intermediate",
      category: "Stack Overflow",
      desc: "Happens when a recursive function fails to hit a base condition or processes excessively deep recursion.",
      code: "def countdown(n):\n    return countdown(n - 1)",
      fix: "def countdown(n):\n    if n <= 0:\n        return\n    countdown(n - 1)",
      concepts: ["Base case termination", "Call stack depth", "Tail-call iteration"]
    }
  ],
  kotlin: [
    {
      title: "NullPointerException (!! force unwrap)",
      difficulty: "beginner",
      category: "Null Safety",
      desc: "Caused by using !! on a nullable reference that turns out to evaluate to null at runtime.",
      code: "val title: String? = null\nprintln(title!!.length)",
      fix: "println(title?.length ?: 0)",
      concepts: ["Safe call (?.)", "Elvis operator (?:)", "Smart casts"]
    },
    {
      title: "LateinitUsageException: lateinit property not initialized",
      difficulty: "intermediate",
      category: "Lifecycle Error",
      desc: "Occurs when accessing a lateinit var in an Android Activity or ViewModel before it has been set.",
      code: "lateinit var binding: ActivityBinding\n// accessed in init before onCreate()",
      fix: "if (::binding.isInitialized) { ... }",
      concepts: ["::isInitialized", "Dependency Injection", "Lifecycle events"]
    },
    {
      title: "ConcurrentModificationException",
      difficulty: "advanced",
      category: "Concurrency",
      desc: "Mutating a MutableList while iterating over it without using an Iterator or thread-safe collection.",
      code: "for (item in list) {\n    if (item.done) list.remove(item)\n}",
      fix: "list.removeAll { it.done }",
      concepts: ["Iterator.remove()", "removeAll predicate", "CopyOnWriteArrayList"]
    }
  ],
  javascript: [
    {
      title: "TypeError: Cannot read properties of undefined",
      difficulty: "beginner",
      category: "Reference Error",
      desc: "Attempting to access a property or method on a variable that holds undefined or null.",
      code: "const user = response.data.user;\nconsole.log(user.profile.avatar);",
      fix: "console.log(user?.profile?.avatar ?? 'default.png');",
      concepts: ["Optional chaining (?.)", "Nullish coalescing (??)", "Defensive parsing"]
    },
    {
      title: "UnhandledPromiseRejection: Network request failed",
      difficulty: "intermediate",
      category: "Async / Await",
      desc: "An asynchronous Promise was rejected with an error, but no .catch() or try/catch block handled it.",
      code: "async function load() {\n    const res = await fetch('/api');\n}",
      fix: "try {\n    const res = await fetch('/api');\n} catch (err) {\n    console.error('Fetch error:', err);\n}",
      concepts: ["try / catch", "Promise rejection", "Error boundary"]
    }
  ],
  java: [
    {
      title: "NullPointerException",
      difficulty: "beginner",
      category: "Memory / Pointer",
      desc: "Invoking an instance method or accessing a member variable of an object whose reference is null.",
      code: "String str = null;\nif (str.equals('ADMIN')) { ... }",
      fix: "if ('ADMIN'.equals(str)) { ... } // Yoda condition prevents NPE",
      concepts: ["Literal comparisons", "Optional<T>", "Objects.requireNonNull()"]
    },
    {
      title: "ClassCastException",
      difficulty: "intermediate",
      category: "Type Cast",
      desc: "Attempting to cast an object to a subclass of which it is not an instance.",
      code: "Object obj = 'hello';\nInteger num = (Integer) obj;",
      fix: "if (obj instanceof Integer num) {\n    System.out.println(num);\n}",
      concepts: ["instanceof pattern matching", "Generic safety", "Type hierarchy"]
    }
  ],
  cpp: [
    {
      title: "Segmentation Fault (SIGSEGV)",
      difficulty: "intermediate",
      category: "Memory Violation",
      desc: "Dereferencing a null or dangling pointer, or reading outside allocated stack or heap buffers.",
      code: "int* ptr = nullptr;\n*ptr = 42;",
      fix: "if (ptr != nullptr) {\n    *ptr = 42;\n}",
      concepts: ["Smart pointers (std::unique_ptr)", "Dangling pointers", "AddressSanitizer"]
    },
    {
      title: "Undefined Behavior: Out of bounds vector access",
      difficulty: "intermediate",
      category: "Buffer Safety",
      desc: "Accessing std::vector with operator[] out of range does not perform bounds checks and corrupts memory.",
      code: "std::vector<int> v = {1, 2};\nint x = v[5]; // Undefined Behavior",
      fix: "int x = v.at(5); // Throws std::out_of_range cleanly",
      concepts: ["vector::at()", "Bounds checking", "RAII"]
    }
  ]
};

const PRACTICE_QUIZ_QUESTIONS = [
  {
    difficulty: "Beginner",
    question: "In Python, which index will access the LAST element of any non-empty list 'items'?",
    code: "items = ['apple', 'banana', 'cherry']",
    options: [
      "items[len(items)]",
      "items[-1]",
      "items[items.length - 1]",
      "items[last]"
    ],
    correctIndex: 1,
    explanation: "Python supports negative indexing where items[-1] cleanly points to the final element in constant time O(1)."
  },
  {
    difficulty: "Intermediate",
    question: "What is the primary bug with using a mutable default argument in Python?",
    code: `def register_user(name, roles=[]):
    roles.append(name)
    return roles`,
    options: [
      "It raises a SyntaxError at compile time.",
      "The default list is instantiated once at function definition time, so all subsequent calls share the same list.",
      "Python garbage collects the list after the first return.",
      "It causes a stack overflow error on the second call."
    ],
    correctIndex: 1,
    explanation: "Default parameter expressions are evaluated once when the function is defined, causing mutations to persist across independent invocations. Fix: 'roles=None' and instantiate inside."
  },
  {
    difficulty: "Intermediate",
    question: "In Kotlin, which operator safely evaluates the right-hand side ONLY if the left-hand side is null?",
    code: "val displayName = user?.name ?: 'Anonymous'",
    options: [
      "The Safe-Call operator (?.)",
      "The Elvis operator (?:)",
      "The Double-Bang operator (!!)",
      "The Identity operator (===)"
    ],
    correctIndex: 1,
    explanation: "The Elvis operator (?:) acts as a null-coalescing fallback. If the preceding expression evaluates to null, the fallback is used."
  },
  {
    difficulty: "Advanced",
    question: "Why should you prefer 'std::make_unique<T>()' over 'new T' in modern C++?",
    code: "auto ptr = std::make_unique<Widget>(arg1, arg2);",
    options: [
      "It compiles faster.",
      "It prevents memory leaks if an exception is thrown during evaluation of function arguments before assignment.",
      "It converts raw pointers to reference counted shared pointers.",
      "It disables destructors for improved performance."
    ],
    correctIndex: 1,
    explanation: "make_unique ensures exception safety and prevents unassigned orphan heap allocations if another subexpression throws an exception."
  }
];

// Explicit window exposure for multi-script reliability
if (typeof window !== 'undefined') {
  window.DEBUGX_SAMPLE_DEMO = DEBUGX_SAMPLE_DEMO;
  window.DEBUGX_TIPS = DEBUGX_TIPS;
  window.INITIAL_HISTORY_ITEMS = INITIAL_HISTORY_ITEMS;
  window.LEARN_ERROR_LIBRARY = LEARN_ERROR_LIBRARY;
  window.PRACTICE_QUIZ_QUESTIONS = PRACTICE_QUIZ_QUESTIONS;
}
