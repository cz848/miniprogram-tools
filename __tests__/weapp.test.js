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

  return promisify(wxLogin)().then(data => expect(data).toMatchObject({
    code: expect.any(String),
    errMsg: expect.any(String),
  })).catch(err => expect(err).toMatchObject({
    errMsg: expect.any(String),
  }));
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
  expect(storage('user')).toEqual('somebody');
  storage.updatePrefix('some_prefix_');
  expect(storage.prefix).toEqual('some_prefix_');
  expect(storage('user')).toBe(undefined);

  storage('user', 'value');
  expect(storage('user')).toEqual('value');
  storage('user', 'value', -1);
  expect(storage('user')).toBe(undefined);
});

test('alert', () => {
  expect(alert('搞错了吧')).toEqual(expect.any(Promise));
  return expect(alert('搞错了吧')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
});

test('confirm', () => {
  expect(confirm('有没有搞错')).toEqual(expect.any(Promise));
  return expect(confirm('有没有搞错')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
});

test('block', () => {
  expect(block('bingo')).toEqual(expect.any(Promise));
  return expect(block('bingo')).resolves.toBe(undefined);
});

test('toast', () => {
  expect(toast('huuuuurrah')).toEqual(expect.any(Promise));
  setCurrentPages(pageStack);
  return expect(toast('huuuuurrah')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
});

test('linkTo', () => {
  setCurrentPages(pageStack);
  expect(getPage().route).toMatch(/list/);
  expect(getCurrentPages()).toHaveLength(2);

  linkTo('index');
  expect(getPage().route).toMatch(/^pages\/index\/index/);
  expect(getCurrentPages()).toHaveLength(3);

  linkTo('product');
  linkTo('detail');
  linkTo('index', 'redirect');
  expect(getPage().route).toMatch(/index/);
  expect(getCurrentPages()).toHaveLength(5);

  linkTo('shop');
  linkTo('order');
  linkTo('cart');
  linkTo('order');
  linkTo('order-confirm');
  expect(getCurrentPages()).toHaveLength(10);
  linkTo('order-list');
  expect(getCurrentPages()).toHaveLength(10);
  linkTo('order-detail');
  expect(getCurrentPages()).toHaveLength(10);

  linkTo('index', 'reLaunch');
  expect(getPage().route).toMatch(/index/);
  expect(getCurrentPages()).toHaveLength(1);

  linkTo('index', { a: 1, b: 2 }, 'redirect');
  expect(getPage().route).toMatch(/index/);
  expect(getPage().query).toEqual({ a: 1, b: 2 });

  linkTo('pages/list/index', 'navigate');
  expect(getPage().route).toMatch(/^pages\/list\/index/);
  expect(getCurrentPages()).toHaveLength(2);

  linkTo('/common/fail/fail');
  expect(getPage().route).toMatch(/fail/);
  expect(getCurrentPages()).toHaveLength(3);

  linkTo('fail/fail');
  expect(getPage().route).toMatch(/^pages\/fail\/fail/);

  linkTo('index?bingo=1', { a: 1, b: { c: 3, d: 4 } });
  expect(getPage().route).toMatch(/^pages\/index\/index/);
  expect(getPage().query).toEqual({ a: 1, b: '{"c":3,"d":4}', bingo: 1 });
});

test('getSystemInfo', () => {
  expect.extend({
    toBeSomeValue(received, ...args) {
      const pass = args.includes(received);
      if (pass) {
        return {
          message: () => `expected ${received} not to be some value of ${args}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be some value of ${args}`,
          pass: false,
        };
      }
    },
  });
  expect(getSystemInfo()).toMatchObject({
    titleBarHeight: expect.toBeSomeValue(44, 48),
    pxRatio: expect.any(Number),
    systemName: expect.toBeSomeValue('android', 'ios'),
    isIPhoneX: expect.any(Boolean),
    brand: expect.any(String),
  });
});
