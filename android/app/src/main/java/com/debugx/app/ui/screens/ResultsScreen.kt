package com.debugx.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.ui.components.CodeViewer
import com.debugx.app.ui.components.ConceptChip
import com.debugx.app.ui.components.ModeSelector
import com.debugx.app.ui.components.SeverityBadge
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun ResultsScreen(
    viewModel: DebugViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToChat: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val result = uiState.analysisResult ?: return
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        // Top Bar
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                }
                Text("Diagnostic Report", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Sample Data Banner
        if (result.isSample) {
            item {
                Surface(
                    color = Color(0x33F59E0B),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66F59E0B))
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(color = ColorWarning, shape = RoundedCornerShape(4.dp)) {
                            Text("SAMPLE", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                        }
                        Text("Section 18 Python IndexError Sample Data.", color = Color(0xFFFCD34D), fontSize = 12.sp)
                    }
                }
            }
        }

        // Explanation Mode Selector
        item {
            ModeSelector(
                selectedMode = uiState.explanationMode,
                onSelect = { viewModel.setExplanationMode(it) }
            )
        }

        // A. Overview Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderAccent)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Surface(color = Color(0x268B5CF6), shape = RoundedCornerShape(4.dp)) {
                                Text(result.errorCategory, color = Color(0xFFC4B5FD), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                            Surface(color = Color(0x2638BDF8), shape = RoundedCornerShape(4.dp)) {
                                Text(result.language, color = AccentSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }
                        SeverityBadge(severity = result.severity)
                    }

                    Text(
                        text = result.errorTitle,
                        color = TextPrimary,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("AI Confidence: ${Math.round(result.confidence * 100)}%", color = AccentSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text(
                            text = if (result.problematicLines.isNotEmpty()) "Line ${result.problematicLines.joinToString()}" else "Identified",
                            color = Color(0xFFF87171),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // B. What Went Wrong?
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("What Went Wrong?", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(result.summary, color = TextSecondary, fontSize = 13.sp, lineHeight = 19.sp)
                }
            }
        }

        // C. Why Did It Happen? (Root Cause)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Why Did It Happen? (Root Cause)", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(result.rootCause, color = TextSecondary, fontSize = 13.sp, lineHeight = 19.sp)
                }
            }
        }

        // D. Problematic Code
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Problematic Code", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                CodeViewer(code = result.originalCode, isError = true)
            }
        }

        // E. Suggested Fix
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Suggested Fix", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    TextButton(onClick = {
                        clipboard.setText(AnnotatedString(result.correctedCode))
                        Toast.makeText(context, "Code copied to clipboard!", Toast.LENGTH_SHORT).show()
                    }) {
                        Text("Copy Code", color = AccentSecondary, fontSize = 12.sp)
                    }
                }
                CodeViewer(code = result.correctedCode, isError = false)
            }
        }

        // F. Why This Fix Works
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Why This Fix Works", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    result.explanation.forEach { step ->
                        Text("• $step", color = TextSecondary, fontSize = 12.sp, lineHeight = 18.sp)
                    }
                }
            }
        }

        // G. Prevention Tips
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Prevention Tips", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    result.preventionTips.forEach { tip ->
                        Text("• $tip", color = TextSecondary, fontSize = 12.sp, lineHeight = 18.sp)
                    }
                }
            }
        }

        // H. Related Concepts
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Related Concepts", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    result.relatedConcepts.forEach { concept ->
                        ConceptChip(text = concept)
                    }
                }
            }
        }

        // CTA: Ask Follow-up
        item {
            Button(
                onClick = onNavigateToChat,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Ask AI Follow-Up", fontWeight = FontWeight.Bold)
            }
        }
    }
}
