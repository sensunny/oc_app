import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gradlePath = path.join(__dirname, '..', 'android', 'gradle.properties');

if (!fs.existsSync(gradlePath)) {
  console.error("❌ gradle.properties not found. Run 'expo prebuild' first.");
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

const replacements = {
  'org.gradle.jvmargs':
    '-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError',
  'org.gradle.parallel': 'false',
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
}

fs.writeFileSync(gradlePath, content.trim() + '\n', 'utf8');
console.log('✅ gradle.properties updated successfully.');
