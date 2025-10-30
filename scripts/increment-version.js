#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');

try {
  // Read package.json
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  // Get current version
  const currentVersion = packageJson.version;
  console.log(`Current version: ${currentVersion}`);

  // Parse version numbers
  const versionParts = currentVersion.split('.');
  const major = parseInt(versionParts[0], 10);
  const minor = parseInt(versionParts[1], 10);
  const patch = parseInt(versionParts[2], 10);

  // Increment patch version
  const newPatch = patch + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;

  // Update package.json
  packageJson.version = newVersion;

  // Write back to file
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`Version incremented: ${currentVersion} → ${newVersion}`);
  console.log(`Updated package.json`);

} catch (error) {
  console.error('Error incrementing version:', error.message);
  process.exit(1);
}