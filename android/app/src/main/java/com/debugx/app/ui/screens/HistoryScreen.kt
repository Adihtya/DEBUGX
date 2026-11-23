package com.debugx.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.ui.components.SeverityBadge
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun HistoryScreen(
    viewModel: DebugViewModel,
    onNavigateToResults: () -> Unit
) {
    val history by viewModel.history.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("All") }

    val filterOptions = listOf("All", "Python", "Kotlin", "JavaScript", "Java")

    val filteredList = history.filter { item ->
        val matchesFilter = selectedFilter == "All" || item.language.equals(selectedFilter, ignoreCase = true)
        val matchesSearch = searchQuery.isBlank() ||
                item.errorTitle.contains(searchQuery, ignoreCase = true) ||
                item.language.contains(searchQuery, ignoreCase = true) ||
                item.summary.contains(searchQuery, ignoreCase = true)
        matchesFilter && matchesSearch
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Saved Records", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("Debugging History", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                }
                if (history.isNotEmpty()) {
                    TextButton(onClick = { viewModel.clearHistory() }) {
                        Text("Clear All", color = ColorError, fontSize = 12.sp)
                    }
                }
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search by error title or language...", fontSize = 13.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = BgCard,
                    unfocusedContainerColor = BgCard,
                    focusedBorderColor = AccentPrimary,
                    unfocusedBorderColor = BorderColor
                ),
                shape = RoundedCornerShape(10.dp),
                singleLine = true
            )
        }

        // Language Filters
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                filterOptions.forEach { opt ->
                    val isActive = selectedFilter == opt
                    Surface(
                        color = if (isActive) AccentPrimary else BgCard,
                        shape = CircleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (isActive) AccentPrimary else BorderColor),
                        modifier = Modifier.clickable { selectedFilter = opt }
                    ) {
                        Text(
                            text = opt,
                            color = if (isActive) Color.White else TextSecondary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        // History Items
        if (filteredList.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("No debugging sessions found", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Analysed errors and fixes will be listed here.", color = TextMuted, fontSize = 12.sp)
                    }
                }
            }
        } else {
            items(filteredList) { item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { viewModel.selectHistoryItem(item, onNavigateToResults) },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = BgCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Surface(color = Color(0x2638BDF8), shape = RoundedCornerShape(4.dp)) {
                                    Text(item.language, color = AccentSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(6.dp, 2.dp))
                                }
                                Surface(color = Color(0x268B5CF6), shape = RoundedCornerShape(4.dp)) {
                                    Text(item.errorCategory, color = Color(0xFFDDD6FE), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(6.dp, 2.dp))
                                }
                            }
                            Text(item.timestamp, color = TextMuted, fontSize = 11.sp)
                        }

                        Text(
                            text = item.errorTitle,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        Text(
                            text = item.summary,
                            color = TextSecondary,
                            fontSize = 12.sp,
                            maxLines = 2,
                            lineHeight = 16.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            SeverityBadge(severity = item.severity)
                            IconButton(
                                onClick = { viewModel.deleteHistoryItem(item) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = TextMuted, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
