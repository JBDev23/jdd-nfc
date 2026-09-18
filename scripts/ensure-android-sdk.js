const fs = require('fs');
const path = require('path');
const os = require('os');

const androidDir = path.join(__dirname, '..', 'android');
const localPropertiesPath = path.join(androidDir, 'local.properties');

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function toGradlePath(sdkPath) {
  return sdkPath.replace(/\\/g, '\\\\');
}

function main() {
  if (!fs.existsSync(androidDir)) {
    console.log('android/ no existe todavía. Ejecuta "npx expo prebuild" primero.');
    return;
  }

  const sdkPath = findAndroidSdk();
  if (!sdkPath) {
    console.error(
      'No se encontró el Android SDK. Instala Android Studio o define ANDROID_HOME.',
    );
    process.exit(1);
  }

  const content = `sdk.dir=${toGradlePath(sdkPath)}\n`;
  fs.writeFileSync(localPropertiesPath, content, 'utf8');
  console.log(`Android SDK configurado en ${localPropertiesPath}`);
}

main();
