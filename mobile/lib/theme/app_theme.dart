import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF8C2F39);
  static const Color cream = Color(0xFFF5EDE4);
  static const Color whiteText = Color(0xFFFFF8F2);
  static const Color dark = Color(0xFF1A0A0A);
  static const Color dark2 = Color(0xFF2C2C2C);
  static const Color error = Color(0xFF8C2F39);

  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      fontFamily: 'PT Mono',
      colorScheme: ColorScheme.fromSeed(
        seedColor: background,
        primary: background,
        secondary: dark2,
        surface: cream,
        error: error,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: whiteText,
          fontSize: 42,
          fontWeight: FontWeight.w800,
          height: 1.1,
        ),
        headlineMedium: TextStyle(
          color: dark,
          fontSize: 28,
          fontWeight: FontWeight.w700,
        ),
        bodyLarge: TextStyle(
          color: dark,
          fontSize: 16,
        ),
        bodyMedium: TextStyle(
          color: dark,
          fontSize: 14,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        labelStyle: const TextStyle(color: dark),
        hintStyle: const TextStyle(color: Colors.black45),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.black.withOpacity(0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.black.withOpacity(0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: background, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: dark,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontFamily: 'PT Mono',
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: cream,
        elevation: 10,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}