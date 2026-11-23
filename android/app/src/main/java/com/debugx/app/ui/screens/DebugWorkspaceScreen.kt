package com.debugx.app.ui.screens

import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.ui.components.ModeSelector
import com.debugx.app.ui.theme.*
import com.debugx.app.viewmodel.DebugViewModel

@Composable
fun DebugWorkspaceScreen(
    viewModel: DebugViewModel,
    onNavigateToResults: () -> Unit,
    onNavigateToCamera: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, it))
            } else {
                @Suppress("DEPRECATION")
                MediaStore.Images.Media.getBitmap(context.contentResolver, it)
            }
            viewModel.updateScreenshot(bitmap)
        }
    }

    val languages = listOf("Python", "Kotlin", "Java", "JavaScript", "TypeScript", "C", "C++", "Swift", "Go", "Rust", "SQL")
    var langMenuExpanded by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BgPrimary)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 16.dp, bottom = 90.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("AI Debugging Engine", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("Workspace", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                }
                OutlinedButton(
                    onClick = { viewModel.loadSection18Sample() },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Sample Bug", fontSize = 12.sp)
                }
            }

            // Section A: Screenshot Upload
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("A. Screenshot Upload", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("PNG, JPG up to 10MB", color = TextMuted, fontSize = 11.sp)
                    }

                    if (uiState.screenshotBitmap != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black)
                        ) {
                            Image(
                                bitmap = uiState.screenshotBitmap!!.asImageBitmap(),
                                contentDescription = "Screenshot Preview",
                                modifier = Modifier.fillMaxSize()
                            )
                            IconButton(
                                onClick = { viewModel.updateScreenshot(null) },
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(6.dp)
                                    .background(Color(0xCC000000), CircleShape)
                                    .size(28.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(100.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF141414))
                                    .border(1.dp, Color(0x667957FF), RoundedCornerShape(8.dp))
                                    .clickable { onNavigateToCamera() },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Color(0xFF7957FF))
                                    Text("Take Live Photo", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Text("Point at monitor screen", color = TextMuted, fontSize = 10.sp)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(100.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(BgInput)
                                    .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                                    .clickable { imagePicker.launch("image/*") },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.CloudUpload, contentDescription = null, tint = AccentSecondary)
                                    Text("Upload Screenshot", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Text("Browse file manager", color = TextMuted, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Section B: Source Code Editor
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("B. Source Code", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box {
                                OutlinedButton(
                                    onClick = { langMenuExpanded = true },
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                    modifier = Modifier.height(30.dp)
                                ) {
                                    Text(uiState.selectedLanguage, fontSize = 11.sp, color = AccentSecondary)
                                }
                                DropdownMenu(
                                    expanded = langMenuExpanded,
                                    onDismissRequest = { langMenuExpanded = false }
                                ) {
                                    languages.forEach { lang ->
                                        DropdownMenuItem(
                                            text = { Text(lang) },
                                            onClick = {
                                                viewModel.updateLanguage(lang)
                                                langMenuExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                            IconButton(
                                onClick = { viewModel.updateCode("") },
                                modifier = Modifier.size(30.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear", tint = TextMuted, modifier = Modifier.size(16.dp))
                            }
                        }
                    }

                    OutlinedTextField(
                        value = uiState.codeInput,
                        onValueChange = { viewModel.updateCode(it) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 150.dp, max = 220.dp),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            color = TextPrimary
                        ),
                        placeholder = { Text("# Paste your code here...", fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = TextMuted) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF0B0E14),
                            unfocusedContainerColor = Color(0xFF0B0E14),
                            focusedBorderColor = AccentPrimary,
                            unfocusedBorderColor = BorderColor
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            // Section C: Explanation Mode
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("C. Explanation Depth", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    ModeSelector(
                        selectedMode = uiState.explanationMode,
                        onSelect = { viewModel.setExplanationMode(it) }
                    )
                }
            }

            // Submit Button
            Button(
                onClick = { viewModel.analyseCode(onNavigateToResults) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Analyse My Code", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }

        // Loading Overlay
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xEE090B10)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.padding(32.dp)
                ) {
                    CircularProgressIndicator(color = AccentPrimary, modifier = Modifier.size(54.dp))
                    Text(uiState.loadingStage, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    LinearProgressIndicator(
                        progress = uiState.loadingProgress,
                        modifier = Modifier.width(220.dp),
                        color = AccentSecondary,
                        trackColor = BgCard
                    )
                }
            }
        }
    }
}
