/*!
 * 统一输出各种方法
 * Author: Tyler.Chao
 * github: https://github.com/cz848/miniprogram-tools
 */

export {
  isPlainObject,
  isEmptyObject,
  isEmptyArray,
  isEmpty,
  getKeys,
  removeEmptyValues,
  clone,
  capitalize,
  toQueryString,
  generateSignature,
  compareVersions,
  sleep,
  randomID,
} from './utils';

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
} from './weapp';
