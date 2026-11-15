import { AppThemeConfig } from '../ast/schema.ts';

export function generateColorKotlin(packageName: string, theme: AppThemeConfig): string {
  const p = theme.primaryColor.replace('#', '').toUpperCase();
  const s = theme.secondaryColor.replace('#', '').toUpperCase();
  const t = theme.tertiaryColor.replace('#', '').toUpperCase();
  const bg = theme.backgroundColor.replace('#', '').toUpperCase();
  const surf = theme.surfaceColor.replace('#', '').toUpperCase();
  const text = (theme.textColor || (theme.isDark ? '#FFFFFF' : '#1D1B20')).replace('#', '').toUpperCase();

  return `package ${packageName}.ui.theme

import androidx.compose.ui.graphics.Color

val PrimaryColor = Color(0xFF${p})
val SecondaryColor = Color(0xFF${s})
val TertiaryColor = Color(0xFF${t})
val BackgroundColor = Color(0xFF${bg})
val SurfaceColor = Color(0xFF${surf})
val TextColor = Color(0xFF${text})
`;
}

export function generateShapeKotlin(packageName: string, theme: AppThemeConfig): string {
  let small = 8;
  let medium = 16;
  let large = 28;

  if (theme.buttonShape === 'sharp') {
    small = 2;
    medium = 4;
    large = 6;
  } else if (theme.buttonShape === 'semi-rounded') {
    small = 4;
    medium = 8;
    large = 12;
  } else if (theme.buttonShape === 'rounded') {
    small = 6;
    medium = 12;
    large = 16;
  } else {
    // pill
    small = 8;
    medium = 20;
    large = 32;
  }

  return `package ${packageName}.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val AppShapes = Shapes(
    small = RoundedCornerShape(${small}.dp),
    medium = RoundedCornerShape(${medium}.dp),
    large = RoundedCornerShape(${large}.dp)
)
`;
}

export function generateThemeKotlin(packageName: string, appName: string): string {
  return `package ${packageName}.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryColor,
    secondary = SecondaryColor,
    tertiary = TertiaryColor,
    background = BackgroundColor,
    surface = SurfaceColor,
    onPrimary = Color.White,
    onBackground = TextColor,
    onSurface = TextColor
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryColor,
    secondary = SecondaryColor,
    tertiary = TertiaryColor,
    background = BackgroundColor,
    surface = SurfaceColor,
    onPrimary = Color.White,
    onBackground = TextColor,
    onSurface = TextColor
)

@Composable
fun ${appName}Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        shapes = AppShapes,
        content = content
    )
}
`;
}

export function generateMainActivityKotlin(packageName: string, appName: string, theme: AppThemeConfig): string {
  const isGradient = theme.backgroundType === 'gradient';

  return `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import ${packageName}.navigation.AppNavigation
import ${packageName}.ui.theme.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${appName}Theme {
                Surface(
                    modifier = Modifier.fillMaxSize()${isGradient ? '\n                        .background(Brush.verticalGradient(listOf(BackgroundColor, SurfaceColor)))' : ''},
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}
`;
}
