package com.debugx.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun ProfileScreen(
    viewModel: DebugViewModel
) {
    var apiKeyText by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

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
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(AccentPrimary, AccentSecondary))),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("AD", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                    }
                    Column {
                        Text("Aditya Chaudhari", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Senior Full-Stack & Android Engineer", color = AccentSecondary, fontSize = 12.sp)
                        Text("dev@debugx.ai", color = TextMuted, fontSize = 11.sp)
                    }
                }
            }
        }

        // Gemini API Configuration
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderAccent)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Google Gemini API Key", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Enables live Gemini 1.5 Flash multimodal reasoning.", color = TextSecondary, fontSize = 12.sp)

                    OutlinedTextField(
                        value = apiKeyText,
                        onValueChange = { apiKeyText = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("AIzaSy... (leave empty for intelligent demo engine)", fontSize = 12.sp, color = TextMuted) },
                        visualTransformation = PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = BgInput,
                            unfocusedContainerColor = BgInput,
                            focusedBorderColor = AccentPrimary,
                            unfocusedBorderColor = BorderColor
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )

                    Button(
                        onClick = {
                            viewModel.setApiKey(apiKeyText)
                            Toast.makeText(context, "API Key updated", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Save Key")
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
                                color = AccentSecondary,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp
                            )
                            TextButton(onClick = {
                                clipboard.setText(AnnotatedString("cd android && ./gradlew assembleDebug"))
                                Toast.makeText(context, "Command copied!", Toast.LENGTH_SHORT).show()
                            }) {
                                Text("Copy", color = Color.White, fontSize = 11.sp)
                            }
                        }
                    }
                    Text("APK output location: android/app/build/outputs/apk/debug/app-debug.apk", color = TextMuted, fontSize = 11.sp)
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("DebugX v1.0.0 (Production Release)", color = TextMuted, fontSize = 11.sp)
                Text("Google Gemini Multimodal Developer Edition", color = TextMuted, fontSize = 10.sp)
            }
        }
    }
}
