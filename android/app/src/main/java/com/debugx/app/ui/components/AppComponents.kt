package com.debugx.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.ui.theme.*

@Composable
fun SeverityBadge(severity: String) {
    val (bgColor, textColor) = when (severity.lowercase()) {
        "critical" -> Color(0x33EF4444) to Color(0xFFF87171)
        "high" -> Color(0x26EF4444) to Color(0xFFFCA5A5)
        "medium" -> Color(0x26F59E0B) to Color(0xFFFBBF24)
        else -> Color(0x2622C55E) to Color(0xFF86EFAC)
    }

    Surface(
        color = bgColor,
        shape = CircleShape,
        border = androidx.compose.foundation.BorderStroke(1.dp, textColor.copy(alpha = 0.5f))
    ) {
        Text(
            text = severity.uppercase(),
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun CodeViewer(
    code: String,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    highlightLine: Int? = null
) {
    val borderColor = if (isError) ColorError.copy(alpha = 0.5f) else ColorSuccess.copy(alpha = 0.5f)
    val headerBg = if (isError) Color(0xFF1F161C) else Color(0xFF13221C)
    val tagText = if (isError) "Original (Problematic)" else "Suggested Fix"
    val tagColor = if (isError) ColorError else ColorSuccess

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0B0E14)),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor)
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(headerBg)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tagText,
                    color = tagColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(12.dp)
            ) {
                Text(
                    text = code,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = TextPrimary
                )
            }
        }
    }
}

@Composable
fun ModeSelector(
    selectedMode: ExplanationMode,
    onSelect: (ExplanationMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .background(BgPrimary)
            .border(1.dp, BorderColor, CircleShape)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        val beginnerActive = selectedMode == ExplanationMode.BEGINNER
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(CircleShape)
                .background(if (beginnerActive) BgCard else Color.Transparent)
                .border(if (beginnerActive) 1.dp else 0.dp, if (beginnerActive) BorderColor else Color.Transparent, CircleShape)
                .clickable { onSelect(ExplanationMode.BEGINNER) }
                .padding(vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "🌱 Beginner Mode",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = if (beginnerActive) TextPrimary else TextSecondary
            )
        }

        val advancedActive = selectedMode == ExplanationMode.ADVANCED
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(CircleShape)
                .background(if (advancedActive) BgCard else Color.Transparent)
                .border(if (advancedActive) 1.dp else 0.dp, if (advancedActive) BorderColor else Color.Transparent, CircleShape)
                .clickable { onSelect(ExplanationMode.ADVANCED) }
                .padding(vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "⚡ Advanced Mode",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = if (advancedActive) TextPrimary else TextSecondary
            )
        }
    }
}

@Composable
fun ConceptChip(
    text: String,
    onClick: () -> Unit = {}
) {
    Surface(
        color = Color(0x1F38BDF8),
        shape = CircleShape,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x4038BDF8)),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = text,
            color = Color(0xFF7DD3FC),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
