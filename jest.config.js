module.exports = {
  verbose: true,
  testRegex: '/__tests__/.*?\\.test\\.js$',
  collectCoverage: true,
  collectCoverageFrom: ['./utils.js', './weapp.js'],
  // 使用 jest 内置 jsdom 进行 dom 环境的模拟
  testEnvironment: 'jsdom',
  // 配置 jest-snapshot-plugin 从而在使用 jest 的 snapshot 功能时获得更加适合肉眼阅读的结构
  snapshotSerializers: ['miniprogram-simulate/jest-snapshot-plugin'],
};
