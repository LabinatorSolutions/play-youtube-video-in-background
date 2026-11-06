// Keeps development files out of the AMO package: only the manifest, icon, locales, script and LICENSE ship.
export default {
  ignoreFiles: [
    // AMO listing assets (icon, screenshots, store text) are uploaded separately.
    'amo',
    'amo/**',
    'node_modules',
    'package.json',
    'bun.lock',
    'eslint.config.js',
    'tsconfig.json',
    'web-ext-config.mjs',
    '*.md',
  ],
};
