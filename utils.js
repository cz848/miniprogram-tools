// 判断是否为json对象
const isPlainObject = value => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return Object.prototype.toString.call(value) === '[object Object]'
    || prototype === null
    || prototype === Object.getPrototypeOf({});
};

// 判断是否为空对象
const isEmptyObject = the => isPlainObject(the) && Object.keys(the).length === 0;

// 判断是否为空数组
const isEmptyArray = the => Array.isArray(the) && the.length === 0;

/**
 * whether the variable is null
 * @param {any} the
 * @param {array} inclusions 其它做为空值的情况
 * @param {array} exclusions 排除无需判断为空值的情况
 */
const isEmpty = (the, inclusions = [], exclusions = []) => {
  const emptyValues = ['', null, undefined, 'undefined']
    .concat(inclusions)
    .filter(e => !exclusions.includes(e));

  return emptyValues.includes(the) // 空值
    || isEmptyArray(the) // 空数组
    || isEmptyObject(the); // 空对象
};

// 过滤出有值的键并返回
const getKeys = (data = {}) => Object.keys(data).filter(key => {
  const value = data[key];
  return !isEmpty(isPlainObject(value) || Array.isArray(value) ? getKeys(value) : value);
});

// 删掉array/object中属性值为空值、空数组、空对象的键
const removeEmptyValues = (data = {}) => {
  const result = Object.keys(data).reduce((gather, key) => {
    const value = data[key];
    if (!isEmpty(value)) {
      if (isPlainObject(value) || Array.isArray(value)) {
        const oValue = removeEmptyValues(value);
        if (!isEmpty(oValue)) gather[key] = oValue;
      } else gather[key] = value;
    }
    return gather;
  }, Array.isArray(data) ? [] : {});

  return Array.isArray(data) ? result.filter(x => x !== undefined) : result;
};

// 实现深拷贝类json对象的最简单版本，可以选择只拷贝某些键值
const clone = (json = {}, keys) => JSON.parse(JSON.stringify(json, keys));

// 字符串首字母大写
const capitalize = (string, prefix = '') => typeof string === 'string'
  ? `${prefix}${string.replace(/(^[a-z])/, $1 => $1.toUpperCase())}`
  : string;

/**
 * parse json to url query string
 * @param {object} json
 * @param {boolean} encode
 * @param {boolean} sort
 */
const toQueryString = (json = {}, encode = false, sort = false) => {
  if (!isPlainObject(json)) return json;
  const params = Object.keys(json);
  if (sort) params.sort();
  return params.reduce((gather, key) => {
    let value = json[key];
    // 不处理所有空值
    if (isEmpty(value)) return gather;
    if (typeof value === 'object') value = JSON.stringify(value);
    return gather.concat(`${key}=${encode ? encodeURIComponent(value) : value}`);
  }, []).join('&');
};

// 生成签名算法，为了兼容考虑，需自定义通用参数及加密函数（sha256），这里有两种生成签名的方式
const generateSignature = (params, { encrypt, isSorted = true, appKey = '', token = '', secret = '' }) => {
  if (typeof encrypt !== 'function') throw new Error('Invalid encryption function');
  let query;
  if (isSorted) {
    query = toQueryString(clone(params), false, isSorted);
  } else {
    query = isEmpty(params) ? '' : JSON.stringify(params);
  }
  return encrypt(appKey + query + token + secret);
};

// 按主版本.次版本.修订版本号-先行版本(.次数/meta) 比较两个版本号大小
const compareVersions = (v1, op, v2 = '') => {
  // 转换版本号为一组数字(类数字)
  const versionToNumbers = v => String(v).replace(/^v/, '').split('.');
  const v1s = versionToNumbers(v1);
  const v2s = versionToNumbers(v2);

  for (let i = 0; i < Math.max(v1s.length, v2s.length); i++) {
    const n1 = parseInt(v1s[i], 10) || 0;
    const n2 = parseInt(v2s[i], 10) || 0;
    if (n1 > n2) return /^>=?$/.test(op);
    if (n1 < n2) return /^<=?$/.test(op);
  }
  return /^[<>]?=$/.test(op);
};

// 等待n毫秒
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms || 1500));

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
};
