import sha256 from 'js-sha256';
import {
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
} from '../utils';

describe('isPlainObject', () => {
  test('纯对象的情况', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({
      a: 1,
      b: 2,
      c: x => x * x,
    })).toBe(true);
    expect(isPlainObject(Object.create({}))).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(new Object(null))).toBe(true);
    expect(isPlainObject(new Object(undefined))).toBe(true);
    expect(isPlainObject(new Object({}))).toBe(true);
  });

  test('非纯对象的情况', () => {
    expect(isPlainObject(new Map([
      ['a', 1],
      ['b', 2],
      ['c', x => x * x],
    ]))).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(Object)).toBe(false);
    expect(isPlainObject(Date)).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(Function)).toBe(false);
    expect(isPlainObject(RegExp)).toBe(false);
    expect(isPlainObject(new Set([0]))).toBe(false);
  });

  test('非对象的情况', () => {
    expect(isPlainObject()).toBe(false);
    expect(isPlainObject('{}')).toBe(false);
    expect(isPlainObject('abcde')).toBe(false);
    expect(isPlainObject(100)).toBe(false);
    expect(isPlainObject('')).toBe(false);
    expect(isPlainObject(false)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(NaN)).toBe(false);
  });
});

describe('isEmptyObject', () => {
  test('为"空纯对象"的情况', () => {
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject(new Object())).toBe(true);
    expect(isEmptyObject(Object.create(null))).toBe(true);
  });

  test('非"空纯对象"的情况', () => {
    expect(isEmptyObject(Object)).toBe(false);
    expect(isEmptyObject({ a: 1 })).toBe(false);
    expect(isEmptyObject([])).toBe(false);
    expect(isEmptyObject(x => x * x)).toBe(false);
    expect(isEmptyObject(null)).toBe(false);
    expect(isEmptyObject('')).toBe(false);
    expect(isEmptyObject(false)).toBe(false);
  });
});

describe('isEmptyArray', () => {
  test('判断是否为"空数组"', () => {
    expect(isEmptyArray([])).toBe(true);
    expect(isEmptyArray([0])).toBe(false);
    expect(isEmptyArray([undefined])).toBe(false);
    expect(isEmptyArray([null])).toBe(false);
    expect(isEmptyArray(undefined)).toBe(false);
    expect(isEmptyArray(null)).toBe(false);
    expect(isEmptyArray({})).toBe(false);
  });
});

describe('isEmpty', () => {
  test('为空值的情况', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('undefined')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);

    expect(isEmpty(false, [false])).toBe(true);
  });

  test('非空值的情况', () => {
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(null, [], [null])).toBe(false);
  });
});

describe('getKeys', () => {
  test('过滤出对象中有值的键并返回包含这些键的数组', () => {
    expect(getKeys({ a: 1, b: '', c: null, d: false })).toEqual(['a', 'd']);
    expect(getKeys([0, 1, '', null, false, undefined])).toEqual(['0', '1', '4']);
  });

  test('值中又有对象的情况', () => {
    expect(getKeys({ a: {}, b: '', c: null, d: false, e: [] })).toEqual(['d']);
    expect(getKeys({ a: { a: null, b: {} }, b: '', c: null, d: false, e: [null, undefined] })).toEqual(['d']);
  });
});

describe('removeEmptyValues', () => {
  test('删掉对象中值为空数组、空对象的键', () => {
    expect(removeEmptyValues({ a: 1, b: '', c: null, d: false })).toEqual({ a: 1, d: false });
    expect(removeEmptyValues([0, 1, '', null, false, undefined])).toEqual([0, 1, false]);
    expect(removeEmptyValues({ a: 1, b: '', c: [0, '', null], d: { a: 1, b: null }, e: [undefined] }))
      .toEqual({ a: 1, c: [0], d: { a: 1 } });
    expect(removeEmptyValues([0, 1, '', { c: 1, d: null }, { e: '' }])).toEqual([0, 1, { c: 1 }]);
  });
});

describe('clone', () => {
  test('实现深拷贝JSON数据的最简单版本，可以选择只拷贝某些键值', () => {
    expect(clone({ a: 1, b: '', c: null, d: false, e: undefined })).toEqual({ a: 1, b: '', c: null, d: false });
    expect(clone({ a: 1, b: '', c: null, d: false }, ['a', 'b', 'c'])).toEqual({ a: 1, b: '', c: null });
    expect(clone({ a: 1, b: '', c: null, d: x => x * x })).toEqual({ a: 1, b: '', c: null });
  });
});

describe('capitalize', () => {
  test('首字母大写', () => {
    expect(capitalize('abcde')).toBe('Abcde');
    expect(capitalize('123e')).toBe('123e');
    expect(capitalize('prefix', 'suffix')).toBe('suffixPrefix');
  });

  test('传入非字符串类型', () => {
    expect(capitalize(1234)).toBe(1234);
    expect(capitalize()).toBe(undefined);
    expect(capitalize(null)).toBe(null);
    expect(capitalize(undefined)).toBe(undefined);
    expect(capitalize(false)).toBe(false);
    expect(capitalize({})).toEqual({});
  });
});

describe('toQueryString', () => {
  test('转换纯对象为url查询字符串', () => {
    expect(toQueryString({ c: 1, b: '', d: null, a: false, f: undefined })).toBe('c=1&a=false');
    expect(toQueryString({ c: 1, b: '', d: null, a: false, f: '中文' }, true)).toBe('c=1&a=false&f=%E4%B8%AD%E6%96%87');
    expect(toQueryString({ c: 1, b: '', d: null, a: false, f: undefined }, false, true)).toBe('a=false&c=1');
    expect(toQueryString({ c: 1, d: { e: 2, f: 'x' } })).toBe('c=1&d={"e":2,"f":"x"}');
  });
  test('空值的情况', () => {
    expect(toQueryString([])).toEqual([]);
    expect(toQueryString({})).toEqual('');
    expect(toQueryString()).toEqual('');
    expect(toQueryString(null)).toEqual(null);
    expect(toQueryString(false)).toEqual(false);
  });
});

describe('generateSignature', () => {
  test('生成签名算法', () => {
    expect(generateSignature({ c: 1, b: '', d: null, a: false, f: undefined }, { encrypt: sha256 }))
      .toBe('2e32f7b5242caea55cafe1add1ff5c6f1e5017d4dc4114ec2ad5bb4775c5e487');
    expect(generateSignature({}, { encrypt: sha256, isSorted: false }))
      .toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(generateSignature({ c: 1, b: '', d: null, a: false, f: '中文' }, {
      encrypt: sha256,
      isSorted: false,
      appKey: 'xwrlt456',
      secret: 'sxxxxxsss',
    })).toBe('845d2c259e0db90d777a7209d6f24edfe270c6af7f097515fc8264c4c1878074');
  });

  test('encrypt非函数', () => {
    const toThrowError = () => {
      generateSignature({ c: 1, b: 2 }, { encrypt: 'abcde' });
    };
    expect(toThrowError).toThrow(Error);
  });
});

describe('compareVersions', () => {
  test('比较两个版本号大小', () => {
    expect(compareVersions('2.5.2', '>', '2.4.9')).toBe(true);
    expect(compareVersions('2.6.2', '<=', '2.6.9')).toBe(true);
    expect(compareVersions('2.5.0', '=', '2.4.9')).toBe(false);
    expect(compareVersions('2.4.9', '=', '2.4.9')).toBe(true);
    expect(compareVersions('v2.10.1', '>', 'v2.9.1')).toBe(true);
    expect(compareVersions('2.4', '<', '2.4.9')).toBe(true);
    expect(compareVersions('2.4.3', '>', '2.4')).toBe(true);
    expect(compareVersions('2.4.3', '>')).toBe(true);
  });

  test('更特殊的版本号', () => {
    expect(compareVersions('v2.10.1-alpha.2', '>', '2.10.1-alpha.1')).toBe(true);
    expect(compareVersions('v2.10.1-alpha.2', '>', '2.10.1-beta.1')).toBe(true);
    expect(compareVersions('v2.10.1-alpha.2', '>=', '2.10.1-beta.1')).toBe(true);
  });
});

describe('sleep', () => {
  test('等待500毫秒', () => sleep(500).then(data => expect(data).toBe(undefined)));
  test('等待1000毫秒', () => expect(sleep(1000)).resolves.toBe(undefined));
  test('等待1500毫秒', async () => {
    const data = await sleep();
    expect(data).toBe(undefined);
  });
});
