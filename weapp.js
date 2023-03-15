import config from './config';
import { isPlainObject, toQueryString, compareVersions } from './utils';

// 小程序api Promise化
const promisify = (api = () => {}) => options => new Promise((resolve, reject) => api({
  success: resolve,
  fail: reject,
  ...options,
}));

const isPromisified = method => compareVersions(wx.version.version, '>=', '2.10.2')
  && !['downloadFile', 'request', 'uploadFile', 'connectSocket', 'createCamera'].includes(method);

// api Promise化后的对象
const promisifyAll = (ctx, apiList) => apiList.forEach(method => {
  ctx[method] = isPromisified(method) ? wx[method] : promisify(wx[method]);
});

const mp = {
  apiList: [],
  add(apis = []) {
    const apiList = apis.filter(x => !this.apiList.includes(x));

    this.apiList = this.apiList.concat(apiList);
    promisifyAll(this, apiList);
  },
};

mp.add(config.WX_APIS);

/**
 * 获取当前页面栈中的页面
 * @param previous 相对于当前页面的索引，负数
 */
const getPage = (previous = 0) => {
  const pages = getCurrentPages();
  return pages[pages.length + previous - 1];
};

/**
 * @param {string} name
 * @param {mixed} value
 * @param {integer} expires, second
 * @example storage('key'): read key
 * @example storage('key', null): delete key
 * @example storage('key', 'value', -1): delete key
 * @example storage('key', null, true): read expires
 * @example storage('key', 'value'): write key, if has expires, continue
 * @example storage('key', 'value', 3600): write key and expires for 1 hour
 */

let STORAGE_PREFIX = config.PREFIX;

const storage = (name, value, expires) => {
  if (!name) return;

  const key = STORAGE_PREFIX + name;
  const now = Math.floor(Date.now() / 1000);
  const del = () => wx.removeStorageSync(key);
  const read = attr => {
    const store = wx.getStorageSync(key) || {};
    if (store.expires && store.expires <= now) return del();
    return store[attr];
  };
  const write = () => {
    const expiresTime = read('expires');
    const data = { value };
    if (+expires) data.expires = now + Math.floor(+expires);
    else if (expiresTime) data.expires = expiresTime;
    try {
      wx.setStorageSync(key, data);
    } catch (e) {
      try {
        wx.setStorageSync(key, data);
      } catch (err) {
        wx.setStorageSync(key, data);
      }
    }
  };

  if (typeof value === 'undefined') return read('value');
  if (value === null && expires === true) return read('expires');
  if (value === null || expires < 0) return del();
  write();
};

storage.updatePrefix = prefix => {
  if (prefix) STORAGE_PREFIX = prefix;
};

// 界面：模态对话框封装
const modals = (content, showCancel, options) => mp.showModal({
  content,
  showCancel,
  confirmText: '确定',
  ...options,
});

const alert = (content, options) => modals(content, false, options);

const confirm = (content, options) => modals(content, true, options);

const block = (content, options) => modals(content, false, {
  confirmText: '返回',
  ...options,
}).then(wx.navigateBack);

const toast = (title, icon = 'none') => {
  const page = getPage() || {};
  if (page.hideLoading) page.hideLoading(true);
  return mp.showToast({ title, icon });
};

// 把传入的路径转成标准的'/pages/index/index'形式，只支持一级目录
// index => /pages/index/index
// product => /pages/product/product
// demo/index => /pages/demo/index
// pages/list/index => /pages/list/index
// pages/list => /pages/list/list
// /pages/list/index => /pages/list/index
// /common/fail/fail => /common/fail/fail
// ?a=1 => ?a=1
const formatPath = path => {
  if (!path || path.startsWith('/')) return path || '';
  let url = String(path).replace(/^pages\//, '');
  const keys = url.match(/^([^?]+)(\?.*)?$/);
  if (!keys) return path;
  return keys[1].includes('/') ? `/pages/${url}` : `/pages/${keys[1]}/${url}`;
};

/*
 * 跳转页面
 * 用法：
 * linkTo('index'); // 不带路径的
 * linkTo('index', 'redirect');
 * linkTo('/common/fail/fail');
 * linkTo('page/fail/fail');
 * linkTo('coupon', {
 *   id: 1,
 *   type,
 * }, 'reLaunch');
 */
const linkTo = (path, query, openType = 'navigateTo') => {
  let params = query;
  let jumpType = openType;
  if (params && typeof params === 'string') {
    params = undefined;
    jumpType = query;
  }
  if (['navigate', 'redirect'].includes(jumpType)) {
    jumpType += 'To';
  }
  const { length } = getCurrentPages();
  if (jumpType === 'navigateTo' && length >= 10) {
    jumpType = 'redirectTo';
  }
  let url = formatPath(path);
  url += isPlainObject(params) ? (url.indexOf('?') > 0 ? '&' : '?') + toQueryString(params) : '';
  wx[jumpType]({ url });
};

// 获取所有系统参数并加入几个有用的字段
const getSystemInfo = () => {
  const sysInfo = wx.getSystemInfoSync();
  const {
    system,
    screenWidth,
  } = sysInfo;
  const systemName = system.split(' ')[0].toLowerCase();
  // getMenuButtonBoundingClientRect有兼容问题，暂时舍弃
  // 默认iOS为44px，安卓则为48px
  const titleBarHeight = systemName.includes('android') ? 48 : 44;
  return {
    ...sysInfo,
    titleBarHeight,
    systemName,
    // 根据屏幕宽度计算像素比率
    pxRatio: screenWidth / 750,
  };
};

export {
  promisify,
  mp,
  getPage,
  storage,
  block,
  alert,
  confirm,
  toast,
  formatPath,
  linkTo,
  getSystemInfo,
};
