package com.debugx.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.AiConnectionState
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun ProfileScreen(
    viewModel: DebugViewModel
) {
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current
    val currentUser by viewModel.currentUser.collectAsState()
    val aiState by viewModel.aiConnectionState.collectAsState()
    val aiLatency by viewModel.aiLatencyMs.collectAsState()

    var showDeleteConfirmDialog by remember { mutableStateOf(false) }

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
                Text("Account & Preferences", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text("Developer Profile", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            }
        }

        // Profile Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    if (!currentUser?.photoURL.isNullOrEmpty()) {
                        coil.compose.AsyncImage(
                            model = currentUser?.photoURL,
                            contentDescription = "Profile Photo",
                            modifier = Modifier
                                .size(54.dp)
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
                                .size(54.dp)
                                .clip(CircleShape)
                                .background(Brush.linearGradient(listOf(AccentPrimary, AccentSecondary))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(initials.ifEmpty { "DX" }, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                        }
                    }

                    Column {
                        Text(currentUser?.displayName ?: "Aditya Chaudhari", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(currentUser?.email ?: "dev@debugx.ai", color = AccentSecondary, fontSize = 12.sp)
                        Text("UID: ${currentUser?.uid?.take(14) ?: "usr_authenticated"}...", color = TextMuted, fontSize = 10.sp)
                    }
                }
            }
        }

        // AI Configuration Section (Section 8 Requirement)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderAccent)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("AI & Backend Configuration", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text("Powered by Supabase Edge Functions & Google Gemini 1.5 Flash.", color = TextSecondary, fontSize = 12.sp)

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF090909), RoundedCornerShape(10.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("BACKEND & AI", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text("Supabase Edge Function", color = TextPrimary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("CONFIGURED MODEL", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text("Gemini 1.5 Flash (Multimodal)", color = TextPrimary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("CONNECTION STATUS", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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
                                Text(aiState.label, color = Color(0xFF22C55E), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("LATENCY", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text("~${aiLatency}ms", color = Color(0xFFA78BFA), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    OutlinedButton(
                        onClick = {
                            viewModel.retryAiConnection()
                            Toast.makeText(context, "Verifying AI connection...", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF7957FF))
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Test / Verify AI Connection", fontSize = 12.sp)
                    }
                }
            }
        }

        // Account & Security Management Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Account & Security", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    Button(
                        onClick = {
                            viewModel.signOut()
                            Toast.makeText(context, "Signed out", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1E1E), contentColor = Color.White)
                    ) {
                        Icon(Icons.Default.ExitToApp, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Sign Out", fontSize = 13.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            showDeleteConfirmDialog = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66EF4444))
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Delete Account & Cloud Data", fontSize = 13.sp)
                    }
                }
            }
        }

        // APK Build Instructions Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131A29)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x6638BDF8))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Build Native Android APK", color = AccentSecondary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("To compile the native DebugX Android APK directly on your machine:", color = TextSecondary, fontSize = 12.sp)

                    Surface(
                        color = Color(0xFF0B0E14),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "cd android && ./gradlew assembleDebug",
                                color = Color(0xFF67E8F9),
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp
                            )
                            Text(
                                "Copy",
                                color = AccentSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable {
                                    clipboard.setText(AnnotatedString("cd android && ./gradlew assembleDebug"))
                                    Toast.makeText(context, "Command copied!", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = { Text("Delete Account?", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "Are you sure you want to permanently delete your account? This will erase your Supabase PostgreSQL developer profile and debugging history.",
                    color = Color(0xFFB3B3B3),
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirmDialog = false
                        viewModel.deleteAccount()
                        Toast.makeText(context, "Account deleted", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Delete Everything", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmDialog = false }) {
                    Text("Cancel", color = Color.White)
                }
            },
            containerColor = Color(0xFF141414)
        )
    }
}
