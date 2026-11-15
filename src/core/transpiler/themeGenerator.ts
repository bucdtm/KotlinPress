import { AppThemeConfig } from '../ast/schema.ts';

export function generateColorKotlin(packageName: string, theme: AppThemeConfig): string {
  const p = theme.primaryColor.replace('#', '').toUpperCase();
  const s = theme.secondaryColor.replace('#', '').toUpperCase();
  const t = theme.tertiaryColor.replace('#', '').toUpperCase();
  const bg = theme.backgroundColor.replace('#', '').toUpperCase();
  const surf = theme.surfaceColor.replace('#', '').toUpperCase();

  return `package ${packageName}.ui.theme

import androidx.compose.ui.graphics.Color

val PrimaryColor = Color(0xFF${p})
val SecondaryColor = Color(0xFF${s})
val TertiaryColor = Color(0xFF${t})
val BackgroundColor = Color(0xFF${bg})
val SurfaceColor = Color(0xFF${surf})
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
    surface = SurfaceColor
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryColor,
    secondary = SecondaryColor,
    tertiary = TertiaryColor,
    background = BackgroundColor,
    surface = SurfaceColor
)

@Composable
fun ${appName}Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
`;
}

export function generateMainActivityKotlin(packageName: string, appName: string): string {
  return `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import ${packageName}.navigation.AppNavigation
import ${packageName}.ui.theme.${appName}Theme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${appName}Theme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
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
