import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AppAST } from '../ast/schema.ts';
import { transpileAppToKotlin } from '../transpiler/kotlinGenerator.ts';
import {
  generateRootBuildGradle,
  generateSettingsGradle,
  generateAppBuildGradle,
  generateLibsVersionsToml,
  generateAndroidManifest,
  generateStringsXml,
  generateSampleImageDrawableXml,
  generateGradleWrapperProperties,
} from './projectTemplate.ts';

export async function createAndroidProjectZip(ast: AppAST): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(ast.appInfo.appName) || zip;

  // 1. Archivos raíz del proyecto
  root.file('build.gradle.kts', generateRootBuildGradle());
  root.file('settings.gradle.kts', generateSettingsGradle(ast.appInfo.appName));
  root.file('gradle.properties', 'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\n');

  // 2. Gradle wrapper
  const wrapperFolder = root.folder('gradle/wrapper');
  if (wrapperFolder) {
    wrapperFolder.file('gradle-wrapper.properties', generateGradleWrapperProperties());
  }

  // 3. Version Catalog (libs.versions.toml)
  const gradleFolder = root.folder('gradle');
  if (gradleFolder) {
    gradleFolder.file('libs.versions.toml', generateLibsVersionsToml());
  }

  // 4. Módulo /app
  const appFolder = root.folder('app');
  if (appFolder) {
    appFolder.file('build.gradle.kts', generateAppBuildGradle(ast));

    // Manifest
    const mainFolder = appFolder.folder('src/main');
    if (mainFolder) {
      mainFolder.file('AndroidManifest.xml', generateAndroidManifest(ast));

      // Recursos Android (Strings y Drawables)
      const valuesFolder = mainFolder.folder('res/values');
      if (valuesFolder) {
        valuesFolder.file('strings.xml', generateStringsXml(ast));
      }

      const drawableFolder = mainFolder.folder('res/drawable');
      if (drawableFolder) {
        drawableFolder.file('sample_image.xml', generateSampleImageDrawableXml());
      }

      // Código fuente Kotlin
      const pkgPath = ast.appInfo.packageName.replace(/\./g, '/');
      const javaFolder = mainFolder.folder(`java/${pkgPath}`);
      if (javaFolder) {
        const transpiled = transpileAppToKotlin(ast);
        for (const file of transpiled.allFiles) {
          javaFolder.file(file.path, file.content);
        }
      }
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function downloadAndroidProjectZip(ast: AppAST): Promise<void> {
  const blob = await createAndroidProjectZip(ast);
  saveAs(blob, `${ast.appInfo.appName}_AndroidStudio.zip`);
}
