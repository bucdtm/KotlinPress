import { AppAST } from '../ast/schema.ts';

export function generateNavHostKotlin(ast: AppAST): string {
  const packageName = ast.appInfo.packageName;
  const startScreen = ast.screens.find(s => s.id === ast.startScreenId) || ast.screens[0];
  const startRoute = startScreen ? startScreen.route : 'home';

  const routeDestinations = ast.screens
    .map(screen => {
      return `        composable("${screen.route}") {\n            ${screen.name}(navController = navController)\n        }`;
    })
    .join('\n');

  return `package ${packageName}.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ${packageName}.ui.screens.*

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "${startRoute}"
    ) {
${routeDestinations}
    }
}
`;
}
