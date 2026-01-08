import fs from "fs";
import path from "path";

const BUILD_FILE = path.join(__dirname, ".build-number");

function getBuildNumber() {
  if (process.env.EXPO_BUILD === "true") {
    let build = 1;

    if (fs.existsSync(BUILD_FILE)) {
      build = Number(fs.readFileSync(BUILD_FILE, "utf8")) + 1;
    }

    fs.writeFileSync(BUILD_FILE, String(build));
    return build;
  }

  // 👇 For expo start / dev mode
  if (fs.existsSync(BUILD_FILE)) {
    return Number(fs.readFileSync(BUILD_FILE, "utf8"));
  }

  return 1;
}

export default ({ config }) => {
  const buildNumber = getBuildNumber();

  console.log("🔢 Build Number:", buildNumber);

  return {
    ...config,
    version: "1.0.0",
    android: {
      ...config.android,
      versionCode: buildNumber,
    },
    ios: {
      ...config.ios,
      buildNumber: String(buildNumber),
    },
  };
};
