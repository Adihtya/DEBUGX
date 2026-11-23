package com.debugx.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Home")
    object Debug : Screen("debug", "Debug")
    object Results : Screen("results", "Analysis")
    object Chat : Screen("chat", "Follow-Up")
    object History : Screen("history", "History")
    object Learn : Screen("learn", "Learn")
    object Profile : Screen("profile", "Profile")
    object Camera : Screen("camera", "Take Photo")
}
