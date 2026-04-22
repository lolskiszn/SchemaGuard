/**
 * Config loader for SchemaGuard
 * Supports .schemaguard.json, schemaguard.config.js
 */

const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const CONFIG_FILES = [
  '.schemaguard.json',
  'schemaguard.config.json',
  'schemaguard.config.js',
];

function findConfig(dir = process.cwd()) {
  for (const file of CONFIG_FILES) {
    const path = resolve(dir, file);
    if (existsSync(path)) {
      return loadConfig(path);
    }
  }
  return null;
}

function loadConfig(path) {
  const ext = path.split('.').pop().toLowerCase();
  
  if (ext === 'js') {
    try {
      return require(path);
    } catch (e) {
      return {};
    }
  }
  
  if (ext === 'json') {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  
  return {};
}

function mergeConfig(CLIConfig = {}) {
  const fileConfig = findConfig();
  if (!fileConfig) return CLIConfig;
  
  return {
    ...fileConfig,
    ...CLIConfig,
    include: CLIConfig.include || fileConfig.include || [],
    exclude: CLIConfig.exclude || fileConfig.exclude || [],
    typeMappings: { ...fileConfig.typeMappings, ...CLIConfig.typeMappings },
  };
}

module.exports = { findConfig, loadConfig, mergeConfig, CONFIG_FILES };
