package com.debugx.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.*
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel
import com.debugx.app.viewmodel.ExplainTab

@Composable
fun ExplainCodeScreen(
    viewModel: DebugViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.explainUiState.collectAsState()
    val context = LocalContext.current

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                context.contentResolver.openInputStream(it)?.bufferedReader()?.use { reader ->
                    val fileContent = reader.readText()
                    viewModel.updateExplainCode(fileContent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    var isEditingCode by remember { mutableStateOf(false) }
    var chatInput by remember { mutableStateOf("") }

    val languages = listOf("Auto-Detect", "Python", "Kotlin", "Java", "JavaScript", "TypeScript", "C++", "Go", "Rust")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Column {
                        Text(
                            text = "Explain My Code",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Interactive line-by-line & logic breakdown",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }

                // Sample Preset Button
                Surface(
                    onClick = { viewModel.loadBinarySearchSample() },
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0x227957FF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x557957FF))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.AutoStories, contentDescription = null, tint = Color(0xFF7957FF), modifier = Modifier.size(14.dp))
                        Text("Sample", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7957FF))
                    }
                }
            }
        }

        // Mode & Controls Bar
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Beginner vs Advanced Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(BgInput)
                            .padding(3.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (state.explanationMode == ExplanationMode.BEGINNER) Color(0xFF7957FF) else Color.Transparent)
                                .clickable { viewModel.setExplainMode(ExplanationMode.BEGINNER) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "🌱 Beginner Mode",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (state.explanationMode == ExplanationMode.BEGINNER) Color.White else TextSecondary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (state.explanationMode == ExplanationMode.ADVANCED) Color(0xFF7957FF) else Color.Transparent)
                                .clickable { viewModel.setExplainMode(ExplanationMode.ADVANCED) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "⚡ Advanced Mode",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (state.explanationMode == ExplanationMode.ADVANCED) Color.White else TextSecondary
                            )
                        }
                    }

                    // Language Chips + File Upload Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            items(languages) { lang ->
                                val selected = state.selectedLanguage == lang
                                Surface(
                                    onClick = { viewModel.updateExplainLanguage(lang) },
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (selected) Color(0x337957FF) else BgInput,
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        if (selected) Color(0xFF7957FF) else BorderColor
                                    )
                                ) {
                                    Text(
                                        text = lang,
                                        fontSize = 11.sp,
                                        color = if (selected) Color(0xFF7957FF) else TextSecondary,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Spacer(Modifier.width(8.dp))

                        // Upload File Button
                        OutlinedButton(
                            onClick = { filePickerLauncher.launch("*/*") },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Upload", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Code View / Editor Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                            Text(
                                text = "Code View (${state.selectedLanguage})",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            TextButton(
                                onClick = { isEditingCode = !isEditingCode },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Icon(
                                    if (isEditingCode) Icons.Default.Visibility else Icons.Default.Edit,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = Color(0xFF7957FF)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(if (isEditingCode) "Interactive Mode" else "Edit Text", fontSize = 11.sp, color = Color(0xFF7957FF))
                            }
                            IconButton(
                                onClick = { viewModel.updateExplainCode("") },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextMuted, modifier = Modifier.size(16.dp))
                            }
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    if (isEditingCode) {
                        OutlinedTextField(
                            value = state.codeInput,
                            onValueChange = { viewModel.updateExplainCode(it) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 180.dp, max = 320.dp),
                            textStyle = LocalTextStyle.current.copy(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                color = TextPrimary
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = BgInput,
                                unfocusedContainerColor = BgInput,
                                focusedBorderColor = Color(0xFF7957FF),
                                unfocusedBorderColor = BorderColor
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )
                    } else {
                        // Interactive Line by Line View
                        val lines = state.codeInput.lines()
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF090909))
                                .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                                .padding(vertical = 6.dp)
                        ) {
                            lines.forEachIndexed { index, lineText ->
                                val lineNumber = index + 1
                                val isSelected = state.selectedLine == lineNumber
                                val hasVariable = state.selectedVariable?.let { lineText.contains(it) } ?: false

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            when {
                                                isSelected -> Color(0x337957FF)
                                                hasVariable -> Color(0x223B82F6)
                                                else -> Color.Transparent
                                            }
                                        )
                                        .clickable {
                                            viewModel.selectExplainLine(lineNumber)
                                            viewModel.setExplainTab(ExplainTab.LINE_BY_LINE)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "$lineNumber",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        color = if (isSelected) Color(0xFF7957FF) else TextMuted,
                                        modifier = Modifier.width(26.dp)
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = lineText.ifEmpty { " " },
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 12.sp,
                                        color = when {
                                            isSelected -> Color.White
                                            hasVariable -> Color(0xFF60A5FA)
                                            lineText.trim().startsWith("#") || lineText.trim().startsWith("//") -> Color(0xFF6B7280)
                                            lineText.contains("def ") || lineText.contains("fun ") || lineText.contains("while ") -> Color(0xFFC084FC)
                                            else -> TextPrimary
                                        },
                                        modifier = Modifier
                                            .weight(1f)
                                            .horizontalScroll(rememberScrollState())
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    // Analyze / Explain Button
                    Button(
                        onClick = { viewModel.explainCode() },
                        enabled = !state.isLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7957FF)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(Modifier.width(8.dp))
                            Text(state.loadingStage, fontSize = 12.sp)
                        } else {
                            Icon(Icons.Default.Psychology, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Explain Code with Gemini AI", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Result Section
        state.explanationResult?.let { result ->
            // Summary & Complexity Card
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = BgSecondary),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x337957FF))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = result.title,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            Surface(
                                shape = CircleShape,
                                color = Color(0x2222C55E)
                            ) {
                                Text(
                                    text = if (state.explanationMode == ExplanationMode.BEGINNER) "Beginner Breakdown" else "Advanced Analysis",
                                    fontSize = 10.sp,
                                    color = Color(0xFF22C55E),
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Text(
                            text = result.summary,
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            color = TextSecondary
                        )

                        // Complexity Pills
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFF090909),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x337957FF)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Text("TIME COMPLEXITY", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                    Text(result.complexity.time, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF7957FF))
                                    Text(result.complexity.timeReasoning, fontSize = 10.sp, color = TextSecondary, lineHeight = 13.sp)
                                }
                            }
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFF090909),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x3338BDF8)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Text("SPACE COMPLEXITY", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                    Text(result.complexity.space, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF38BDF8))
                                    Text(result.complexity.spaceReasoning, fontSize = 10.sp, color = TextSecondary, lineHeight = 13.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Tabs Selector
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val tabs = listOf(
                        ExplainTab.LINE_BY_LINE to "Line-by-Line",
                        ExplainTab.VARIABLES to "Variables & Scope",
                        ExplainTab.VISUALIZERS to "Loop & Function Visualizer",
                        ExplainTab.EXECUTION_FLOW to "Execution Flow",
                        ExplainTab.PREDICTED_OUTPUT to "Predicted Output",
                        ExplainTab.BUGS_OPTIMIZATION to "Bugs & Tweaks",
                        ExplainTab.ASK_AI to "Ask AI"
                    )
                    items(tabs) { (tab, label) ->
                        val isSelected = state.activeTab == tab
                        Surface(
                            onClick = { viewModel.setExplainTab(tab) },
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) Color(0xFF7957FF) else BgSecondary,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Color(0xFF7957FF) else BorderColor
                            )
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else TextSecondary,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            // Active Tab Content
            when (state.activeTab) {
                ExplainTab.LINE_BY_LINE -> {
                    items(result.lineExplanations) { lineExp ->
                        val isSelected = state.selectedLine == lineExp.line
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) Color(0xFF1E1730) else BgSecondary
                            ),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Color(0xFF7957FF) else BorderColor
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewModel.selectExplainLine(lineExp.line) }
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = if (isSelected) Color(0xFF7957FF) else Color(0x227957FF)
                                    ) {
                                        Text(
                                            "Line ${lineExp.line}",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) Color.White else Color(0xFF7957FF),
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                    Text(lineExp.role, fontSize = 10.sp, color = TextMuted)
                                }

                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFF090909),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = lineExp.code.trim(),
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        color = Color.White,
                                        modifier = Modifier.padding(8.dp)
                                    )
                                }

                                Text(
                                    text = lineExp.explanation,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp,
                                    color = TextPrimary
                                )

                                if (lineExp.beginnerAnalogy.isNotEmpty()) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = Color(0x1122C55E),
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x3322C55E)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(8.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Icon(Icons.Default.Lightbulb, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(14.dp))
                                            Text(
                                                text = lineExp.beginnerAnalogy,
                                                fontSize = 11.sp,
                                                color = Color(0xFF86EFAC)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                ExplainTab.VARIABLES -> {
                    items(result.variables) { variable ->
                        val isSelected = state.selectedVariable == variable.name
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) Color(0xFF1E1730) else BgSecondary
                            ),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Color(0xFF7957FF) else BorderColor
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    viewModel.selectExplainVariable(
                                        if (isSelected) null else variable.name
                                    )
                                }
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = variable.name,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF60A5FA)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Surface(shape = RoundedCornerShape(4.dp), color = Color(0x227957FF)) {
                                            Text(variable.type, fontSize = 10.sp, color = Color(0xFFC084FC), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                        }
                                        Surface(shape = RoundedCornerShape(4.dp), color = Color(0x2238BDF8)) {
                                            Text(variable.scope, fontSize = 10.sp, color = Color(0xFF38BDF8), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                        }
                                    }
                                }

                                Text(text = variable.purpose, fontSize = 12.sp, color = TextPrimary)

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("Declared at line ${variable.declaredLine}", fontSize = 10.sp, color = TextMuted)
                                    if (variable.usedLines.isNotEmpty()) {
                                        Text("• Used on lines: ${variable.usedLines.joinToString(", ")}", fontSize = 10.sp, color = TextMuted)
                                    }
                                }
                            }
                        }
                    }
                }

                ExplainTab.VISUALIZERS -> {
                    item {
                        Text("Loop Iteration Trace", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Spacer(Modifier.height(6.dp))
                    }
                    if (result.loopVisualizer.isEmpty()) {
                        item {
                            Text("No iterative loops detected in this code snippet.", fontSize = 12.sp, color = TextMuted)
                        }
                    } else {
                        items(result.loopVisualizer) { iter ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            "Iteration ${iter.iteration}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF7957FF)
                                        )
                                        Text(iter.explanation, fontSize = 11.sp, color = TextSecondary)
                                    }

                                    // State chips
                                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        items(iter.variablesState.entries.toList()) { entry ->
                                            Surface(
                                                shape = RoundedCornerShape(6.dp),
                                                color = Color(0xFF090909),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x337957FF))
                                            ) {
                                                Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) {
                                                    Text(entry.key, fontFamily = FontFamily.Monospace, fontSize = 10.sp, color = TextMuted)
                                                    Text(" = ", fontSize = 10.sp, color = TextMuted)
                                                    Text(entry.value, fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Spacer(Modifier.height(10.dp))
                        Text("Function Call Stack Frames", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Spacer(Modifier.height(6.dp))
                    }
                    items(result.functionVisualizer) { frame ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = BgSecondary),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x3338BDF8))
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        "Frame #${frame.frame}: ${frame.functionName}()",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF38BDF8)
                                    )
                                    Text(frame.status, fontSize = 10.sp, color = Color(0xFF22C55E))
                                }
                                Text("Arguments: ${frame.arguments}", fontSize = 11.sp, color = TextSecondary)
                                Text("Return Value: ${frame.returnValue}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }

                ExplainTab.EXECUTION_FLOW -> {
                    items(result.executionFlow) { step ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF7957FF)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("${step.step}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Spacer(Modifier.width(10.dp))
                            Card(
                                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text("Line ${step.line}", fontSize = 10.sp, color = Color(0xFF7957FF), fontWeight = FontWeight.Bold)
                                    Text(step.description, fontSize = 12.sp, color = TextPrimary)
                                }
                            }
                        }
                    }
                }

                ExplainTab.PREDICTED_OUTPUT -> {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = BgSecondary),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                // Honest Static Inference Warning Badge
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = Color(0x22F59E0B),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66F59E0B)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(Icons.Default.WarningAmber, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                                        Text(
                                            result.predictedOutput.executionNotice,
                                            fontSize = 11.sp,
                                            color = Color(0xFFFCD34D),
                                            lineHeight = 15.sp
                                        )
                                    }
                                }

                                Text("PREDICTED TERMINAL / RETURN OUTPUT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = Color(0xFF090909),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = result.predictedOutput.outputText,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 13.sp,
                                        color = Color(0xFF22C55E),
                                        modifier = Modifier.padding(12.dp)
                                    )
                                }

                                Text("Reasoning: ${result.predictedOutput.reasoning}", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }
                }

                ExplainTab.BUGS_OPTIMIZATION -> {
                    if (result.bugsAndImprovements.isEmpty()) {
                        item {
                            Text("No major bugs or inefficiencies detected.", fontSize = 12.sp, color = TextSecondary)
                        }
                    } else {
                        items(result.bugsAndImprovements) { issue ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33F59E0B))
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("${issue.type} (Line ${issue.line})", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF59E0B))
                                        Text("Severity: ${issue.severity}", fontSize = 10.sp, color = TextMuted)
                                    }
                                    Text(issue.issue, fontSize = 12.sp, color = TextPrimary)
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = Color(0xFF090909),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "Fix: ${issue.fix}",
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 11.sp,
                                            color = Color(0xFF86EFAC),
                                            modifier = Modifier.padding(8.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                ExplainTab.ASK_AI -> {
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Quick question chips
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                val suggestions = listOf(
                                    "Explain the loop condition",
                                    "Can we optimize the space?",
                                    "What happens with empty input?",
                                    "Is there an integer overflow hazard?"
                                )
                                items(suggestions) { q ->
                                    Surface(
                                        onClick = { viewModel.sendExplainQuestion(q) },
                                        shape = RoundedCornerShape(16.dp),
                                        color = BgSecondary,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x337957FF))
                                    ) {
                                        Text(q, fontSize = 10.sp, color = Color(0xFFC084FC), modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                                    }
                                }
                            }

                            // Conversation Messages
                            state.followUpQuestions.forEach { msg ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = if (msg.isUser) Arrangement.End else Arrangement.Start
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(
                                            topStart = 12.dp,
                                            topEnd = 12.dp,
                                            bottomStart = if (msg.isUser) 12.dp else 2.dp,
                                            bottomEnd = if (msg.isUser) 2.dp else 12.dp
                                        ),
                                        color = if (msg.isUser) Color(0xFF7957FF) else BgSecondary,
                                        border = androidx.compose.foundation.BorderStroke(
                                            1.dp,
                                            if (msg.isUser) Color.Transparent else BorderColor
                                        ),
                                        modifier = Modifier.widthIn(max = 280.dp)
                                    ) {
                                        Text(
                                            text = msg.text,
                                            fontSize = 12.sp,
                                            color = Color.White,
                                            modifier = Modifier.padding(10.dp),
                                            lineHeight = 16.sp
                                        )
                                    }
                                }
                            }

                            // Chat Input Box
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = chatInput,
                                    onValueChange = { chatInput = it },
                                    placeholder = { Text("Ask anything about this code...", fontSize = 12.sp) },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true,
                                    textStyle = LocalTextStyle.current.copy(fontSize = 12.sp, color = TextPrimary),
                                    shape = RoundedCornerShape(24.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = BgInput,
                                        unfocusedContainerColor = BgInput,
                                        focusedBorderColor = Color(0xFF7957FF),
                                        unfocusedBorderColor = BorderColor
                                    ),
                                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                                    keyboardActions = KeyboardActions(onSend = {
                                        if (chatInput.isNotBlank()) {
                                            viewModel.sendExplainQuestion(chatInput)
                                            chatInput = ""
                                        }
                                    })
                                )
                                Spacer(Modifier.width(8.dp))
                                IconButton(
                                    onClick = {
                                        if (chatInput.isNotBlank()) {
                                            viewModel.sendExplainQuestion(chatInput)
                                            chatInput = ""
                                        }
                                    },
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(Color(0xFF7957FF), CircleShape)
                                ) {
                                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(24.dp))
        }
    }
}
