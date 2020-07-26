// 最低基础库版本要求2.2.2
const info = 'getAccountInfoSync' in wx ? wx.getAccountInfoSync().miniProgram : null;
// storage存储键需要的前缀
const PREFIX = info ? `${info.appId}${info.envVersion || ''}_` : 'miniprogram-tools_';
// 需要Promise化的小程序api
const WX_APIS = [
  'showModal',
  'showToast',
  'request',
];

export default {
  PREFIX,
  WX_APIS,
};
