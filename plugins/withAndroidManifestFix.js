const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidManifestFix = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Find the application element
    const application = androidManifest.application[0];
    
    // Add tools namespace if not present
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    // Find the meta-data element for notification color
    if (application['meta-data']) {
      application['meta-data'] = application['meta-data'].map(meta => {
        if (meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_color') {
          // Add tools:replace attribute
          meta.$['tools:replace'] = 'android:resource';
          meta.$['android:resource'] = '@color/notification_icon_color';
        }
        return meta;
      });
    }
    
    return config;
  });
};

module.exports = withAndroidManifestFix;