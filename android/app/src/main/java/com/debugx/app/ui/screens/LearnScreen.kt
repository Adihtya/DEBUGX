package com.debugx.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.ui.theme.*

@Composable
fun LearnScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Error Library", "Bug Challenges", "Quiz")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        item {
            Column {
                Text("Improve Your Skills", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text("Learning Centre", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            }
        }

        // Tab Selector
        item {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = BgCard,
                contentColor = AccentPrimary,
                modifier = Modifier.clip(RoundedCornerShape(10.dp))
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                color = if (selectedTab == index) AccentSecondary else TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    )
                }
            }
        }

        if (selectedTab == 0) {
            // Error Library Cards
            item {
                LearnErrorCard(
                    title = "IndexError: list index out of range",
                    lang = "Python",
                    difficulty = "Beginner",
                    desc = "Attempting to access an index that exceeds the total count of elements.",
                    code = "items = ['a', 'b']\nprint(items[2])  # 0-based: only 0 and 1 exist",
                    fix = "if len(items) > 2:\n    print(items[2])"
                )
            }
            item {
                LearnErrorCard(
                    title = "NullPointerException (!! force-unwrap)",
                    lang = "Kotlin",
                    difficulty = "Beginner",
                    desc = "Using the !! operator on a nullable reference that evaluates to null at runtime.",
                    code = "val title: String? = null\nprintln(title!!.length)",
                    fix = "println(title?.length ?: 0)"
                )
            }
            item {
                LearnErrorCard(
                    title = "TypeError: Cannot read properties of undefined",
                    lang = "JavaScript",
                    difficulty = "Beginner",
                    desc = "Accessing object properties or invoking .map() on an unresolved asynchronous state.",
                    code = "const user = response.data;\nconsole.log(user.profile.name);",
                    fix = "console.log(user?.profile?.name ?? 'Anonymous');"
                )
            }
        } else if (selectedTab == 1) {
            // Challenges
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = BgCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderAccent)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Challenge 1: The Off-By-One Boundary", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Fix the factorial loop so it correctly includes 'n' in the range.", color = TextSecondary, fontSize = 12.sp)
                        Surface(color = Color(0xFF0B0E14), shape = RoundedCornerShape(8.dp)) {
                            Text(
                                text = "def factorial(n):\n    result = 1\n    for i in range(1, n): # BUG!\n        result *= i\n    return result",
                                color = TextPrimary,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                        Text("Solution: range(1, n + 1) ensures the stop parameter includes n.", color = ColorSuccess, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        } else {
            // Practice Quiz
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = BgCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Surface(color = Color(0x268B5CF6), shape = RoundedCornerShape(4.dp)) {
                            Text("Intermediate Quiz", color = Color(0xFFDDD6FE), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(6.dp, 2.dp))
                        }
                        Text("What is the primary bug with using mutable default arguments in Python?", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Surface(color = Color(0xFF0B0E14), shape = RoundedCornerShape(6.dp)) {
                            Text(
                                text = "def add_user(name, users=[]):\n    users.append(name)\n    return users",
                                color = TextPrimary,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                        Text("✓ Answer: Default arguments are evaluated once at function definition time, so mutations persist across all future invocations.", color = ColorSuccess, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun LearnErrorCard(
    title: String,
    lang: String,
    difficulty: String,
    desc: String,
    code: String,
    fix: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BgCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
                Surface(color = Color(0x2638BDF8), shape = RoundedCornerShape(4.dp)) {
                    Text(lang, color = AccentSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(4.dp, 2.dp))
                }
            }
            Text(desc, color = TextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
            Surface(color = Color(0xFF0B0E14), shape = RoundedCornerShape(6.dp)) {
                Text(code, color = Color(0xFFFCA5A5), fontFamily = FontFamily.Monospace, fontSize = 11.sp, modifier = Modifier.padding(8.dp))
            }
            Surface(color = Color(0xFF0B0E14), shape = RoundedCornerShape(6.dp)) {
                Text(fix, color = Color(0xFF86EFAC), fontFamily = FontFamily.Monospace, fontSize = 11.sp, modifier = Modifier.padding(8.dp))
            }
        }
    }
}
