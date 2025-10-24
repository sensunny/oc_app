const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "..", "android", "gradle.properties");

if (!fs.existsSync(gradlePath)) {
  console.error("❌ gradle.properties not found. Run 'expo prebuild' first.");
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, "utf8");

// Replace or add the properties
const replacements = {
  "org.gradle.jvmargs": "-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError",
  "org.gradle.parallel": "false",
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
}

fs.writeFileSync(gradlePath, content.trim() + "\n", "utf8");

console.log("✅ gradle.properties updated successfully.");
