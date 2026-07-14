const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports its database engine as a WebAssembly asset.
config.resolver.assetExts.push('wasm');

module.exports = config;
