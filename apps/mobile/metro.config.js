const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve workspace packages to source for Metro
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@flirty/shared') {
    return {
      filePath: path.resolve(workspaceRoot, 'packages/shared/src/index.ts'),
      type: 'sourceFile',
    };
  }
  if (moduleName === '@flirty/validation') {
    return {
      filePath: path.resolve(workspaceRoot, 'packages/validation/src/index.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
