// Keeps development files out of the AMO package: only the manifest, icon, locales, script and LICENSE ship.
export default {
  ignoreFiles: [
    'node_modules',
    'package.json',
    'bun.lock',
    'eslint.config.js',
    'tsconfig.json',
    'web-ext-config.mjs',
    '*.md',
  ],
};
