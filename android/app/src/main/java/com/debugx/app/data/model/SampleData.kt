package com.debugx.app.data.model

object SampleData {
    val SECTION_18_SAMPLE = DebugResponse(
        language = "Python",
        errorTitle = "IndexError: list index out of range",
        errorCategory = "Runtime Error",
        severity = "Medium",
        confidence = 0.95,
        problematicLines = listOf(2),
        summary = "The code is trying to access an element that does not exist.",
        rootCause = "The list contains fewer elements than the index being accessed. In Python, lists use zero-based indexing.",
        originalCode = "numbers = [10, 20, 30]\nprint(numbers[5])",
        correctedCode = "numbers = [10, 20, 30]\n\nif len(numbers) > 5:\n    print(numbers[5])\nelse:\n    print(\"Index does not exist\")",
        explanation = listOf(
            "The list starts at index 0: numbers[0]=10, numbers[1]=20, numbers[2]=30.",
            "The requested index 5 is outside the available 3-item range.",
            "Checking len(numbers) > 5 prevents the program from throwing an unhandled exception."
        ),
        preventionTips = listOf(
            "Check list length before accessing elements.",
            "Iterate directly using 'for num in numbers:' instead of indexing.",
            "Use try / except IndexError for graceful error handling."
        ),
        relatedConcepts = listOf(
            "List indexing",
            "Array bounds",
            "Exception handling"
        ),
        needsMoreInformation = false,
        isSample = true,
        timestamp = "Sample Demo"
    )

    val INITIAL_HISTORY = listOf(
        SECTION_18_SAMPLE,
        DebugResponse(
            language = "Kotlin",
            errorTitle = "NullPointerException: Attempt to invoke virtual method on null object",
            errorCategory = "Null Safety",
            severity = "Critical",
            confidence = 0.98,
            problematicLines = listOf(14),
            summary = "Unsafe force-unwrapping (!!) on a nullable user profile repository object.",
            rootCause = "The userProfile variable was accessed using 'userProfile!!.displayName' before the network fetch completed.",
            originalCode = "val userProfile: User? = userRepository.getUser()\nval name = userProfile!!.displayName",
            correctedCode = "val userProfile: User? = userRepository.getUser()\nval name = userProfile?.displayName ?: \"Guest Developer\"",
            explanation = listOf(
                "Kotlin's double-bang (!!) operator forces unwrapping and bypasses compile-time null safety.",
                "Using the safe-call operator (?.) paired with Elvis (?:) provides an elegant fallback."
            ),
            preventionTips = listOf("Avoid the '!!' operator in production Kotlin.", "Use sealed UI states."),
            relatedConcepts = listOf("Null Safety", "Safe Call Operator", "Elvis Operator"),
            needsMoreInformation = false,
            isSample = false,
            timestamp = "Today, 14:20"
        ),
        DebugResponse(
            language = "JavaScript",
            errorTitle = "TypeError: Cannot read properties of undefined (reading 'map')",
            errorCategory = "Type Error",
            severity = "High",
            confidence = 0.94,
            problematicLines = listOf(7),
            summary = "Invoked .map() on an async API response before the promise resolved.",
            rootCause = "Component rendered initially with items initialized to undefined instead of [].",
            originalCode = "const [items, setItems] = useState();\nreturn <div>{items.map(i => <span>{i.name}</span>)}</div>;",
            correctedCode = "const [items, setItems] = useState([]);\nreturn <div>{items?.map(i => <span key={i.id}>{i.name}</span>)}</div>;",
            explanation = listOf(
                "Initial state was undefined, causing undefined.map() during initial paint.",
                "Defaulting useState([]) ensures map is always a callable array prototype."
            ),
            preventionTips = listOf("Always supply safe initial state defaults in React hooks."),
            relatedConcepts = listOf("Optional Chaining", "React Lifecycle", "Array Prototypes"),
            needsMoreInformation = false,
            isSample = false,
            timestamp = "Yesterday, 19:45"
        )
    )

    val TIPS = listOf(
        "Isolate with Binary Search Debugging: When diagnosing an unexpected state in a 1,000-line module, divide your code in half with a checkpoint log. You can pinpoint the exact line in fewer than 10 iterations.",
        "Rubber Duck Debugging: Explaining your code line by line forces your brain to shift from assumption to explicit verification. You will often spot the syntax or logical flaw mid-sentence.",
        "Never Trust Silent Catch Blocks: Empty catch blocks swallow critical stack traces and lead to ghost bugs. Always log the exception type, message, and cause when debugging.",
        "Check Mutability & References: In Python and JS, passing a list or object as a default argument binds a single persistent reference across all invocations. Use 'None' and instantiate inside."
    )
}
