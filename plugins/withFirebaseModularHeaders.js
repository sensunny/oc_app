const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Pods that need modular headers for Firebase Swift compatibility
      const modularHeaderPods = [
        'GoogleUtilities',
        'FirebaseCore',
        'FirebaseCoreInternal',
        'FirebaseInstallations',
        'FirebaseMessaging',
        'GoogleDataTransport',
        'nanopb',
      ];

      const modularHeaderLines = modularHeaderPods
        .map((pod) => `  pod '${pod}', :modular_headers => true`)
        .join('\n');

      const marker = "use_expo_modules!";

      if (podfileContent.includes(marker) && !podfileContent.includes(':modular_headers => true')) {
        podfileContent = podfileContent.replace(
          marker,
          `${marker}\n\n  # Firebase Swift pods modular headers (auto-added by withFirebaseModularHeaders plugin)\n${modularHeaderLines}`
        );

        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('✅ Added Firebase modular headers to Podfile');
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
