package com.debugx.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.AiConnectionState
import com.debugx.app.data.model.SampleData
import com.debugx.app.ui.components.SeverityBadge
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun HomeScreen(
    viewModel: DebugViewModel,
    onNavigateToDebug: () -> Unit,
    onNavigateToResults: () -> Unit,
    onNavigateToCamera: () -> Unit = {},
    onNavigateToExplain: () -> Unit = {}
) {
    val history by viewModel.history.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val aiState by viewModel.aiConnectionState.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 80.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (!currentUser?.photoURL.isNullOrEmpty()) {
                        coil.compose.AsyncImage(
                            model = currentUser?.photoURL,
                            contentDescription = "Profile Photo",
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        val initials = (currentUser?.displayName ?: "DX")
                            .split(" ")
                            .mapNotNull { it.firstOrNull()?.toString() }
                            .take(2)
                            .joinToString("")
                            .uppercase()

                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Brush.linearGradient(listOf(AccentPrimary, AccentSecondary))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(initials.ifEmpty { "DX" }, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                    Column {
                        val greetingName = currentUser?.displayName?.split(" ")?.firstOrNull() ?: "Developer"
                        Text("Welcome back, $greetingName", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Ready to squash some bugs?", color = TextMuted, fontSize = 12.sp)
                    }
                }

                // AI Engine Indicator Badge
                Surface(
                    shape = CircleShape,
                    color = Color(0x1F7957FF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x407957FF))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(
                                    when (aiState) {
                                        AiConnectionState.CONNECTED -> Color(0xFF22C55E)
                                        AiConnectionState.CONNECTING -> Color(0xFFF59E0B)
                                        AiConnectionState.QUOTA_EXCEEDED -> Color(0xFFEF4444)
                                        else -> Color(0xFF38BDF8)
                                    }
                                )
                        )
                        Text(
                            text = if (aiState == AiConnectionState.CONNECTED) "AI CONNECTED" else aiState.label.uppercase(),
                            color = Color(0xFFA78BFA),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }

        // Hero Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderAccent)
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        color = Color(0x268B5CF6),
                        shape = CircleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x408B5CF6))
                    ) {
                        Text(
                            text = "✨ Gemini 1.5 Multimodal Engine",
                            color = Color(0xFFDDD6FE),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }

                    Text(
                        text = "What are we debugging today?",
                        color = TextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        lineHeight = 26.sp
                    )

                    Text(
                        text = "Upload error screenshots or paste source code. Get senior-engineer root cause analysis and verified fixes.",
                        color = TextSecondary,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Button(
                            onClick = onNavigateToDebug,
                            colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.BugReport, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Start Debugging", fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                viewModel.loadSection18Sample()
                                onNavigateToResults()
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Try Sample Bug", color = TextPrimary)
                        }
                    }
                }
            }
        }

        // Explain My Code Feature Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x557957FF)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToExplain() }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Color(0x337957FF)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.AutoStories,
                            contentDescription = null,
                            tint = Color(0xFF7957FF),
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                "FEATURE: Explain My Code",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF7957FF)
                            ) {
                                Text(
                                    "NEW",
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            "Interactive line-by-line analysis, loop/function visualizers & complexity",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )
                    }

                    Icon(
                        Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color(0xFF7957FF),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        // Quick Actions
        item {
            Text("Quick Actions", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    title = "Take Photo",
                    subtitle = "Monitor capture",
                    icon = Icons.Default.CameraAlt,
                    color = Color(0xFF7957FF),
                    onClick = onNavigateToCamera
                )
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    title = "Upload Image",
                    subtitle = "OCR traces",
                    icon = Icons.Default.Image,
                    color = AccentSecondary,
                    onClick = onNavigateToDebug
                )
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    title = "Paste Code",
                    subtitle = "15+ languages",
                    icon = Icons.Default.Code,
                    color = AccentPrimary,
                    onClick = onNavigateToDebug
                )
            }
        }

        // Metrics Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MetricWidget(
                    modifier = Modifier.weight(1f),
                    label = "ERRORS ANALYSED",
                    value = "128",
                    sub = "+18% this week",
                    subColor = ColorSuccess
                )
                MetricWidget(
                    modifier = Modifier.weight(1f),
                    label = "BUGS FIXED",
                    value = "126",
                    sub = "98.4% resolution",
                    subColor = AccentSecondary
                )
            }
        }

        // Tip of the Day
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF191B28)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x4DF59E0B))
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "💡 SENIOR ENGINEER DEBUGGING TIP",
                        color = Color(0xFFFBBF24),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Isolate with Binary Search Debugging",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "When diagnosing an unexpected state in a 1,000-line module, divide your code in half with a log. You can pinpoint the exact line in fewer than 10 iterations.",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Recent Activity
        item {
            Text("Recent Activity", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        items(history.take(3)) { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        viewModel.selectHistoryItem(item, onNavigateToResults)
                    },
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(item.language, color = AccentSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("•", color = TextMuted)
                            Text(item.timestamp, color = TextMuted, fontSize = 11.sp)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = item.errorTitle,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            maxLines = 1
                        )
                    }
                    SeverityBadge(severity = item.severity)
                }
            }
        }
    }
}

@Composable
fun QuickActionCard(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BgCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
            }
            Text(title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(subtitle, color = TextMuted, fontSize = 11.sp)
        }
    }
}

@Composable
fun MetricWidget(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    sub: String,
    subColor: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BgCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(label, color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(value, color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Text(sub, color = subColor, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}
