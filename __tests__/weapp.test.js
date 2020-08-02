const path = require('path');
require('miniprogram-simulate');
require('./mock');
const {
  promisify,
  mp,
  getPage,
  storage,
  alert,
  confirm,
  block,
  toast,
  linkTo,
  getSystemInfo,
} = require('../weapp');
const { sleep } = require('../utils');

test('promisify', async () => {
  const wxLogin = ({ success, fail }) => {
    setTimeout(() => wx.login({ success, fail }), 300);
  };

  return promisify(wxLogin)().then(data => {
    expect(data).toMatchObject({
      code: expect.any(String),
      errMsg: expect.any(String),
    });
  }).catch(err => {
    expect(err).toMatchObject({
      errMsg: expect.any(String),
    });
  });
});

test('mp', async () => {
  mp.add();
  mp.add(['getSystemInfo']);

  expect(mp.apiList).toEqual(['showModal', 'showToast', 'request', 'getSystemInfo']);

  const res = await mp.getSystemInfo().catch(e => e);
  expect(res).toEqual(expect.any(Object));
  expect(res).toMatchObject({
    SDKVersion: expect.any(String),
    batteryLevel: expect.any(Number),
    brand: expect.any(String),
    model: expect.any(String),
    platform: expect.any(String),
    statusBarHeight: expect.any(Number),
    version: expect.any(String),
  });
});

const pageStack = [{
  route: 'pages/index/index',
  data: {},
}, {
  route: 'pages/list/list',
  data: {},
  hideLoading() {},
}];

test('getPage', () => {
  setCurrentPages(pageStack);
  expect(getPage()).toEqual(expect.any(Object));
  expect(getPage().route).toMatch(/list/);
  expect(getPage(-1)).toEqual(expect.any(Object));
  expect(getPage(-1).route).toMatch(/index/);
});

test('storage', async () => {
  expect(storage('')).toBe(undefined);
  storage('abcde', '12345');
  storage('abcde', { a: 1, b: 2, c: 3, d: 4, e: 5 });
  expect(storage('abcde')).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 });
  storage('abcde', null);
  expect(storage('abcde')).toBe(undefined);
  // with expires
  const now = Math.floor(new Date() / 1000);
  storage('user', 'tyler', 1);
  expect(storage('user')).toEqual(expect.anything());
  expect(storage('user', null, true)).toEqual(now + 1);
  storage('user', 'someone');
  expect(storage('user')).toEqual(expect.anything());
  expect(storage('user', null, true)).toEqual(now + 1);
  await sleep(1200);
  expect(storage('user')).toBe(undefined);
  expect(storage('user', null, true)).toBe(undefined);

  storage('user', 'somebody');
  expect(storage('user')).toEqual(expect.anything());
  storage.updatePrefix('some_prefix_');
  expect(storage.prefix).toEqual('some_prefix_');
  expect(storage('user')).toBe(undefined);
});

test('alert', () => {
  expect(alert('搞错了吧')).toEqual(expect.any(Promise));
  return expect(alert('搞错了吧')).resolves.toEqual({errMsg: expect.stringMatching(/ok$/)});
});

test('confirm', () => {
  expect(confirm('有没有搞错')).toEqual(expect.any(Promise));
  return expect(confirm('有没有搞错')).resolves.toEqual({errMsg: expect.stringMatching(/ok$/)});
});

test('block', () => {
  expect(block('bingo')).toEqual(expect.any(Promise));
  return expect(block('bingo')).resolves.toBe(undefined);
});

test('toast', () => {
  expect(toast('huuuuurrah')).toEqual(expect.any(Promise));
  setCurrentPages(pageStack);
  return expect(toast('huuuuurrah')).resolves.toEqual({errMsg: expect.stringMatching(/ok$/)});
});

test('linkTo', () => {
  setCurrentPages(pageStack);
  expect(getPage().route).toMatch(/list/);

  linkTo('index');
  expect(getPage().route).toMatch(/index/);
  expect(getCurrentPages().length).toEqual(1);

  linkTo('product');
  linkTo('detail');
  linkTo('index', 'redirect');
  expect(getPage().route).toMatch(/index/);
  expect(getCurrentPages().length).toEqual(3);

  linkTo('index', {a: 1, b: 2}, 'redirect');
  expect(getPage().route).toMatch(/index/);
  expect(getPage().query).toEqual({a: 1, b: 2});

  linkTo('index', 'reLaunch');
  expect(getPage().route).toMatch(/index/);
  expect(getCurrentPages().length).toEqual(1);

  linkTo('/common/fail/fail');
  expect(getPage().route).toMatch(/fail/);
  expect(getCurrentPages().length).toEqual(2);
});

test('getSystemInfo', () => {
  expect(getSystemInfo()).toMatchObject({
    titleBarHeight: expect.any(Number),
    pxRatio: expect.any(Number),
    systemName: expect.any(String),
  });
});
