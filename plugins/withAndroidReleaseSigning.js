const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (!buildGradle.includes('MYAPP_RELEASE_STORE_FILE')) {
      buildGradle = buildGradle.replace(
        /signingConfigs\s*\{/,
        `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }`
      );
    }

    buildGradle = buildGradle.replace(
      /signingConfig signingConfigs\.debug/g,
      'signingConfig signingConfigs.release'
    );

    config.modResults.contents = buildGradle;
    return config;
  });
};
