import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { sampleAppAST } from '../ast/sampleApp.ts';
import { createAndroidProjectZip } from './zipPackager.ts';

describe('Android Project ZIP Packager', () => {
  it('genera un archivo ZIP con toda la estructura de Android Studio y arquitectura UiState/ViewModel', async () => {
    const blob = await createAndroidProjectZip(sampleAppAST);
    expect(blob.size).toBeGreaterThan(1000);

    const zip = await JSZip.loadAsync(blob);
    const files = Object.keys(zip.files);

    const appName = sampleAppAST.appInfo.appName;
    expect(files).toContain(`${appName}/build.gradle.kts`);
    expect(files).toContain(`${appName}/settings.gradle.kts`);
    expect(files).toContain(`${appName}/gradle/libs.versions.toml`);
    expect(files).toContain(`${appName}/gradle/wrapper/gradle-wrapper.properties`);
    expect(files).toContain(`${appName}/app/build.gradle.kts`);
    expect(files).toContain(`${appName}/app/src/main/AndroidManifest.xml`);
    expect(files).toContain(`${appName}/app/src/main/res/values/strings.xml`);

    // Comprobar archivos Kotlin de la arquitectura moderna
    const pkgPath = sampleAppAST.appInfo.packageName.replace(/\./g, '/');
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/MainActivity.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/navigation/AppNavigation.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/HomeScreenUiState.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/HomeScreenViewModel.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/HomeScreen.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/TasksScreenUiState.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/TasksScreenViewModel.kt`);
    expect(files).toContain(`${appName}/app/src/main/java/${pkgPath}/ui/screens/TasksScreen.kt`);
  });
});
