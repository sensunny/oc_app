const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "..", "android", "gradle.properties");

if (!fs.existsSync(gradlePath)) {
  console.error("❌ gradle.properties not found. Run 'expo prebuild' first.");
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, "utf8");

const replacements = {
  "org.gradle.jvmargs": "-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8",
  "org.gradle.daemon": "false",
  "org.gradle.parallel": "false",
  "org.gradle.workers.max": "1",
  "ksp.incremental": "false",
  "kotlin.compiler.execution.strategy": "in-process",
  // Kotlin daemon memory (often the real culprit)
  "kotlin.daemon.jvmargs": "-Xmx2g -XX:MaxMetaspaceSize=512m",
};

// escape regex special chars in key
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");
  const line = `${key}=${value}`;

  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content += `\n${line}`;
  }
}

fs.writeFileSync(gradlePath, content.trim() + "\n", "utf8");
console.log("✅ gradle.properties updated successfully.");
