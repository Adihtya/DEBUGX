package com.debugx.app.ui.screens

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.AuthState
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun WelcomeScreen(
    viewModel: DebugViewModel
) {
    val context = LocalContext.current
    val authState by viewModel.authState.collectAsState()
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090909))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 400.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(22.dp)
        ) {
            // Logo & Brand Header
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0x267957FF))
                        .border(1.dp, Color(0x667957FF), RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "DX",
                        color = Color(0xFF7957FF),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 24.sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "DEBUG",
                        color = Color(0xFFA78BFA),
                        fontWeight = FontWeight.Black,
                        fontSize = 32.sp,
                        letterSpacing = (-1).sp
                    )
                    Text(
                        "X",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Black,
                        fontSize = 32.sp,
                        letterSpacing = (-1).sp
                    )
                }

                Text(
                    text = "Find the Bug. Understand the Cause. Fix with Confidence.",
                    color = Color(0xFF929292),
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            // Welcome Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF252525))
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Welcome to DebugX",
                            color = Color(0xFFF5F5F5),
                            fontWeight = FontWeight.Bold,
                            fontSize = 19.sp
                        )
                        Text(
                            text = "Your personal AI debugging companion.",
                            color = Color(0xFF929292),
                            fontSize = 12.sp
                        )
                    }

                    // Continue with Google Button
                    Button(
                        onClick = {
                            viewModel.signInWithGoogle(context)
                        },
                        enabled = authState !is AuthState.Authenticating,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color(0xFF1F1F1F)
                        )
                    ) {
                        if (authState is AuthState.Authenticating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color(0xFF7957FF),
                                strokeWidth = 2.dp
                            )
                            Spacer(Modifier.width(10.dp))
                            Text(
                                "Authenticating...",
                                color = Color(0xFF1F1F1F),
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                // Google "G" circle badge
                                Surface(
                                    modifier = Modifier.size(20.dp),
                                    shape = CircleShape,
                                    color = Color(0xFF4285F4)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text("G", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                                Spacer(Modifier.width(12.dp))
                                Text(
                                    "Continue with Google",
                                    color = Color(0xFF1F1F1F),
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }

                    // Demo / Offline Instant Sign-In
                    OutlinedButton(
                        onClick = {
                            viewModel.signInAsDemo()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x337957FF)),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color(0xFFA78BFA)
                        )
                    ) {
                        Text(
                            "Continue as Demo Developer (Instant)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Feature highlights
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0x08FFFFFF), RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0x1AFFFFFF), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FeatureCheckItem("Automatic Firebase AI Logic integration")
                        FeatureCheckItem("Zero API key setup needed")
                        FeatureCheckItem("Cloud Firestore user profile & history")
                    }

                    // Legal links
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Privacy Policy",
                            color = Color(0xFF929292),
                            fontSize = 11.sp,
                            modifier = Modifier.clickable { showPrivacyDialog = true }
                        )
                        Text("  •  ", color = Color(0xFF404040), fontSize = 11.sp)
                        Text(
                            "Terms of Service",
                            color = Color(0xFF929292),
                            fontSize = 11.sp,
                            modifier = Modifier.clickable { showTermsDialog = true }
                        )
                    }
                }
            }
        }
    }

    // Privacy Policy Dialog
    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy Policy", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "DebugX only requests authentication details (Google UID, Name, Email, Profile Picture) to provide personal debugging history and preferences. Code snippets and screenshots are processed in-memory by Firebase AI Logic and are never used to train public models without consent.",
                    color = Color(0xFFB3B3B3),
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyDialog = false }) {
                    Text("Close", color = Color(0xFF7957FF))
                }
            },
            containerColor = Color(0xFF141414)
        )
    }

    // Terms of Service Dialog
    if (showTermsDialog) {
        AlertDialog(
            onDismissRequest = { showTermsDialog = false },
            title = { Text("Terms of Service", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "DebugX provides AI-assisted code diagnostics. Output is statically modeled via syntax and compiler AST simulation. Users are encouraged to review all AI patches prior to deploying to production systems.",
                    color = Color(0xFFB3B3B3),
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                TextButton(onClick = { showTermsDialog = false }) {
                    Text("Close", color = Color(0xFF7957FF))
                }
            },
            containerColor = Color(0xFF141414)
        )
    }
}

@Composable
private fun FeatureCheckItem(text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            Icons.Default.Check,
            contentDescription = null,
            tint = Color(0xFF22C55E),
            modifier = Modifier.size(14.dp)
        )
        Text(text, color = Color(0xFF929292), fontSize = 11.sp)
    }
}
