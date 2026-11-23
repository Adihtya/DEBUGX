package com.debugx.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Data models for FEATURE 3: EXPLAIN MY CODE
 */
data class CodeExplanationResponse(
    @SerializedName("language")
    val language: String = "Python",

    @SerializedName("title")
    val title: String = "Code Explanation",

    @SerializedName("summary")
    val summary: String = "",

    @SerializedName("complexity")
    val complexity: ComplexityInfo = ComplexityInfo(),

    @SerializedName("line_explanations")
    val lineExplanations: List<LineExplanation> = emptyList(),

    @SerializedName("variables")
    val variables: List<VariableInfo> = emptyList(),

    @SerializedName("control_structures")
    val controlStructures: List<ControlStructure> = emptyList(),

    @SerializedName("function_hierarchy")
    val functionHierarchy: List<FunctionHierarchy> = emptyList(),

    @SerializedName("execution_flow")
    val executionFlow: List<ExecutionStep> = emptyList(),

    @SerializedName("loop_visualizer")
    val loopVisualizer: List<LoopIteration> = emptyList(),

    @SerializedName("function_visualizer")
    val functionVisualizer: List<FunctionCallFrame> = emptyList(),

    @SerializedName("predicted_output")
    val predictedOutput: PredictedOutput = PredictedOutput(),

    @SerializedName("bugs_and_improvements")
    val bugsAndImprovements: List<CodeIssue> = emptyList(),

    val isSample: Boolean = false,
    val timestamp: String = "Just now"
)

data class ComplexityInfo(
    @SerializedName("time")
    val time: String = "O(n)",

    @SerializedName("time_reasoning")
    val timeReasoning: String = "Linear scan across input elements.",

    @SerializedName("space")
    val space: String = "O(1)",

    @SerializedName("space_reasoning")
    val spaceReasoning: String = "Only constant auxiliary memory used."
)

data class LineExplanation(
    @SerializedName("line")
    val line: Int = 1,

    @SerializedName("code")
    val code: String = "",

    @SerializedName("explanation")
    val explanation: String = "",

    @SerializedName("beginner_analogy")
    val beginnerAnalogy: String = "",

    @SerializedName("role")
    val role: String = "Statement"
)

data class VariableInfo(
    @SerializedName("name")
    val name: String = "",

    @SerializedName("type")
    val type: String = "Any",

    @SerializedName("scope")
    val scope: String = "Local",

    @SerializedName("declared_line")
    val declaredLine: Int = 1,

    @SerializedName("used_lines")
    val usedLines: List<Int> = emptyList(),

    @SerializedName("purpose")
    val purpose: String = ""
)

data class ControlStructure(
    @SerializedName("type")
    val type: String = "Loop", // Loop | Condition | Function | Class

    @SerializedName("line_range")
    val lineRange: String = "1-5",

    @SerializedName("condition")
    val condition: String = "",

    @SerializedName("explanation")
    val explanation: String = "",

    @SerializedName("termination")
    val termination: String = ""
)

data class FunctionHierarchy(
    @SerializedName("name")
    val name: String = "",

    @SerializedName("parameters")
    val parameters: List<String> = emptyList(),

    @SerializedName("returns")
    val returns: String = "void",

    @SerializedName("callers")
    val callers: List<String> = emptyList(),

    @SerializedName("callees")
    val callees: List<String> = emptyList()
)

data class ExecutionStep(
    @SerializedName("step")
    val step: Int = 1,

    @SerializedName("line")
    val line: Int = 1,

    @SerializedName("description")
    val description: String = ""
)

data class LoopIteration(
    @SerializedName("iteration")
    val iteration: Int = 1,

    @SerializedName("variables_state")
    val variablesState: Map<String, String> = emptyMap(),

    @SerializedName("explanation")
    val explanation: String = ""
)

data class FunctionCallFrame(
    @SerializedName("frame")
    val frame: Int = 1,

    @SerializedName("function_name")
    val functionName: String = "",

    @SerializedName("arguments")
    val arguments: Map<String, String> = emptyMap(),

    @SerializedName("return_value")
    val returnValue: String = "",

    @SerializedName("status")
    val status: String = "Completed"
)

data class PredictedOutput(
    @SerializedName("output_text")
    val outputText: String = "",

    @SerializedName("is_statically_predicted")
    val isStaticallyPredicted: Boolean = true,

    @SerializedName("confidence")
    val confidence: Double = 0.95,

    @SerializedName("reasoning")
    val reasoning: String = "",

    @SerializedName("execution_notice")
    val executionNotice: String = "Statically predicted via AST simulation. Not run in a live sandboxed runtime."
)

data class CodeIssue(
    @SerializedName("type")
    val type: String = "Improvement", // Bug | Inefficient Logic | Improvement

    @SerializedName("line")
    val line: Int = 1,

    @SerializedName("severity")
    val severity: String = "Low",

    @SerializedName("issue")
    val issue: String = "",

    @SerializedName("fix")
    val fix: String = ""
)

object ExplainSampleData {
    val BINARY_SEARCH_SAMPLE = CodeExplanationResponse(
        language = "Python",
        title = "Binary Search Algorithm",
        summary = "An efficient divide-and-conquer algorithm to locate a target element in a pre-sorted sequence by halving the search space on each iteration.",
        complexity = ComplexityInfo(
            time = "O(log n)",
            timeReasoning = "The search interval is halved at each step until length reaches 1.",
            space = "O(1)",
            spaceReasoning = "Iterative implementation using only three integer pointers (low, high, mid)."
        ),
        lineExplanations = listOf(
            LineExplanation(
                line = 1,
                code = "def binary_search(arr, target):",
                explanation = "Defines the binary_search function accepting a sorted list 'arr' and a search key 'target'.",
                beginnerAnalogy = "Like establishing rules for searching a word in a sorted dictionary.",
                role = "Function Definition"
            ),
            LineExplanation(
                line = 2,
                code = "    low, high = 0, len(arr) - 1",
                explanation = "Initializes two pointer indices: 'low' at index 0 and 'high' at the final array index.",
                beginnerAnalogy = "Placing your left finger at page 1 and right finger at the very last page.",
                role = "Pointer Initialization"
            ),
            LineExplanation(
                line = 3,
                code = "    while low <= high:",
                explanation = "While loop condition checks whether the active search window is still valid.",
                beginnerAnalogy = "Keeps searching as long as the left page number is not past the right page number.",
                role = "Loop Invariant"
            ),
            LineExplanation(
                line = 4,
                code = "        mid = (low + high) // 2",
                explanation = "Calculates the median index of the current boundary using integer division.",
                beginnerAnalogy = "Opening the book exactly in the middle between your two fingers.",
                role = "Bisection Calculation"
            ),
            LineExplanation(
                line = 5,
                code = "        if arr[mid] == target:",
                explanation = "Direct match check: if middle element matches the target, the search succeeded.",
                beginnerAnalogy = "Checking if the word you're looking at right now is the exact match.",
                role = "Success Condition"
            ),
            LineExplanation(
                line = 6,
                code = "            return mid",
                explanation = "Returns the 0-based index where the target was found.",
                beginnerAnalogy = "Calling out the page number where the word was found.",
                role = "Return Value"
            ),
            LineExplanation(
                line = 7,
                code = "        elif arr[mid] < target:",
                explanation = "If the middle element is smaller than target, target must reside in the right half.",
                beginnerAnalogy = "If 'Cat' comes alphabetically before 'Dog', you can discard the entire left half of the book.",
                role = "Right Half Partition"
            ),
            LineExplanation(
                line = 8,
                code = "            low = mid + 1",
                explanation = "Shifts the lower boundary to one position past the middle index.",
                beginnerAnalogy = "Moving your left finger just past the middle page.",
                role = "Pointer Shift"
            ),
            LineExplanation(
                line = 9,
                code = "        else:",
                explanation = "Otherwise, target is smaller than middle element, so it must reside in the left half.",
                beginnerAnalogy = "Discarding the entire right half of the book.",
                role = "Left Half Partition"
            ),
            LineExplanation(
                line = 10,
                code = "            high = mid - 1",
                explanation = "Shifts the upper boundary to one position before the middle index.",
                beginnerAnalogy = "Moving your right finger just before the middle page.",
                role = "Pointer Shift"
            ),
            LineExplanation(
                line = 11,
                code = "    return -1",
                explanation = "If boundaries cross without a match, target does not exist in array.",
                beginnerAnalogy = "If your fingers cross, the word is not in the book.",
                role = "Failure Sentinel"
            )
        ),
        variables = listOf(
            VariableInfo(
                name = "arr",
                type = "List[int]",
                scope = "Parameter",
                declaredLine = 1,
                usedLines = listOf(2, 5, 7),
                purpose = "Sorted collection of elements to search through"
            ),
            VariableInfo(
                name = "target",
                type = "int",
                scope = "Parameter",
                declaredLine = 1,
                usedLines = listOf(5, 7),
                purpose = "Value being searched for"
            ),
            VariableInfo(
                name = "low",
                type = "int",
                scope = "Local",
                declaredLine = 2,
                usedLines = listOf(3, 4, 8),
                purpose = "Left boundary index of the search space"
            ),
            VariableInfo(
                name = "high",
                type = "int",
                scope = "Local",
                declaredLine = 2,
                usedLines = listOf(3, 4, 10),
                purpose = "Right boundary index of the search space"
            ),
            VariableInfo(
                name = "mid",
                type = "int",
                scope = "Local",
                declaredLine = 4,
                usedLines = listOf(5, 6, 7, 8, 10),
                purpose = "Calculated center index of current boundary"
            )
        ),
        controlStructures = listOf(
            ControlStructure(
                type = "while loop",
                lineRange = "3-10",
                condition = "low <= high",
                explanation = "Executes logarithmic bisections while the boundary contains at least one candidate.",
                termination = "Terminates when low exceeds high or on return mid."
            )
        ),
        functionHierarchy = listOf(
            FunctionHierarchy(
                name = "binary_search",
                parameters = listOf("arr: List[int]", "target: int"),
                returns = "int (-1 or index)",
                callers = listOf("main"),
                callees = emptyList()
            )
        ),
        executionFlow = listOf(
            ExecutionStep(1, 1, "Define function entry point binary_search(arr, target)."),
            ExecutionStep(2, 2, "Initialize low = 0 and high = len(arr) - 1."),
            ExecutionStep(3, 3, "Evaluate loop guard: check if low <= high."),
            ExecutionStep(4, 4, "Compute mid = (low + high) // 2."),
            ExecutionStep(5, 5, "Compare arr[mid] against target: check equality, less than, or greater than."),
            ExecutionStep(6, 8, "Update pointer (low = mid + 1 or high = mid - 1) and loop back."),
            ExecutionStep(7, 11, "Return match index or -1 if search space is exhausted.")
        ),
        loopVisualizer = listOf(
            LoopIteration(
                iteration = 1,
                variablesState = mapOf("low" to "0", "high" to "6", "mid" to "3", "arr[mid]" to "15", "target" to "23"),
                explanation = "arr[3]=15 is less than target 23. Move low from 0 to 4."
            ),
            LoopIteration(
                iteration = 2,
                variablesState = mapOf("low" to "4", "high" to "6", "mid" to "5", "arr[mid]" to "30", "target" to "23"),
                explanation = "arr[5]=30 is greater than target 23. Move high from 6 to 4."
            ),
            LoopIteration(
                iteration = 3,
                variablesState = mapOf("low" to "4", "high" to "4", "mid" to "4", "arr[mid]" to "23", "target" to "23"),
                explanation = "arr[4]=23 equals target 23! Return index 4."
            )
        ),
        functionVisualizer = listOf(
            FunctionCallFrame(
                frame = 1,
                functionName = "binary_search",
                arguments = mapOf("arr" to "[2, 5, 8, 15, 23, 30, 45]", "target" to "23"),
                returnValue = "4",
                status = "Success (Found at index 4)"
            )
        ),
        predictedOutput = PredictedOutput(
            outputText = "Index: 4",
            isStaticallyPredicted = true,
            confidence = 0.99,
            reasoning = "Target 23 exists in the test sequence [2, 5, 8, 15, 23, 30, 45] at index 4.",
            executionNotice = "Statically predicted via AST simulation. Not run in a live sandboxed runtime."
        ),
        bugsAndImprovements = listOf(
            CodeIssue(
                type = "Optimization",
                line = 4,
                severity = "Low",
                issue = "In languages with fixed integer widths (C++, Java), (low + high) may overflow integer MAX.",
                fix = "Use 'mid = low + (high - low) // 2' to guarantee overflow safety."
            ),
            CodeIssue(
                type = "Improvement",
                line = 1,
                severity = "Low",
                issue = "No type annotations provided on function arguments.",
                fix = "Add typing annotations: def binary_search(arr: list[int], target: int) -> int:"
            )
        ),
        isSample = true
    )
}
