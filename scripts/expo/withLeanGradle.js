// A small Expo config plugin shared by both apps (v9). With Skia and the other native libraries the
// Android build on EAS ran out of memory ("Gradle build daemon disappeared unexpectedly"). This keeps
// the build lean by writing three lines into android/gradle.properties when EAS generates the project:
//   - build native code only for real phones: arm64-v8a (modern) and armeabi-v7a (older 32-bit phones,
//     still common in Pakistan); emulator CPU types are left out;
//   - at most two Gradle workers at a time, so parallel C++ compiles don't exhaust the machine;
//   - a clear memory limit for Gradle's own JVM.
const { withGradleProperties } = require('expo/config-plugins');

const PROPS = {
  reactNativeArchitectures: 'arm64-v8a,armeabi-v7a',
  'org.gradle.workers.max': '2',
  'org.gradle.jvmargs': '-Xmx3g -XX:MaxMetaspaceSize=768m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
};

module.exports = function withLeanGradle(config) {
  return withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const at = c.modResults.findIndex((p) => p.type === 'property' && p.key === key);
      if (at >= 0) c.modResults[at] = { type: 'property', key, value };
      else c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });
};
module.exports.PROPS = PROPS;
