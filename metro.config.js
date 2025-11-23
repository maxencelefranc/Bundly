const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Alias missing optional RSC runtime to a no-op shim to fix bundling
config.resolver = config.resolver || {};
config.resolver.alias = {
	...(config.resolver.alias || {}),
	'@expo/metro-runtime/rsc/runtime': path.resolve(__dirname, 'shims', 'expo-metro-runtime-rsc-runtime.js')
};

module.exports = config;
