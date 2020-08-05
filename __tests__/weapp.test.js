require('miniprogram-simulate');
require('./mock');
const config = require('../config').default;
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

describe('promisify', () => {
  const wxLogin = ({ success, fail }) => {
    setTimeout(() => wx.login({ success, fail }), 200);
  };

  test('把wx api或符合success/fail回调的方法Promise化', () => promisify(wxLogin)()
    .then(data => expect(data).toMatchObject({
      code: expect.any(String),
      errMsg: expect.any(String),
    }))
    .catch(err => expect(err).toMatchObject({
      errMsg: expect.any(String),
    })));

  test('async/await调用', async () => {
    const res = await promisify(wxLogin)().catch(e => e);

    expect(res).toMatchObject({
      code: expect.any(String),
      errMsg: expect.any(String),
    });
  });
});

describe('mp', () => {
  test('add api list', () => {
    mp.add();
    mp.add(['getSystemInfo']);
    expect(mp.apiList).toEqual(['showModal', 'showToast', 'request', 'getSystemInfo']);
  });

  test('async/await调用api', async () => {
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
});

const pageStack = [{
  route: 'pages/index/index',
  data: {},
}, {
  route: 'pages/list/list',
  data: {},
  hideLoading() {},
}];

describe('getPage', () => {
  setCurrentPages(pageStack);

  test('获取当前页面', () => {
    expect(getPage()).toEqual(expect.any(Object));
    expect(getPage().route).toMatch(/list/);
  });

  test('获取上一页', () => {
    expect(getPage(-1)).toEqual(expect.any(Object));
    expect(getPage(-1).route).toMatch(/index/);
  });

  // afterAll(setCurrentPages);
});

describe('storage', () => {
  test('存数据', () => {
    const prefix = config.PREFIX;
    const key = 'abcde';
    let value = '12345';
    storage(key, value);
    expect(wx.getStorageSync(prefix + key)).toEqual({ value });

    value = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    storage(key, value);
    expect(wx.getStorageSync(prefix + key)).toEqual({ value });
  });

  test('取数据', () => {
    const prefix = config.PREFIX;
    const key = 'abcde';
    const value = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    expect(storage(key)).toEqual(value);
    expect(storage(key)).toEqual(wx.getStorageSync(prefix + key).value);
  });

  test('with expires', async () => {
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
  });

  test('update prefix', () => {
    let prefix = config.PREFIX;
    const key = 'user';
    expect(prefix).toEqual(expect.any(String));
    storage(key, 'somebody');
    expect(storage(key)).toEqual(wx.getStorageSync(prefix + key).value);

    prefix = 'some_prefix_';
    storage.updatePrefix(prefix);
    expect(storage(key)).toBe(undefined);
    storage(key, 'somebody');
    expect(storage(key)).toEqual(wx.getStorageSync(prefix + key).value);

    storage.updatePrefix();
    expect(storage(key)).toBe('somebody');
  });

  test('delete storage', () => {
    storage('user', 'value');
    expect(storage('user')).toEqual('value');
    storage('user', 'value', -1);
    expect(storage('user')).toBe(undefined);

    const key = 'abcde';
    storage(key, 'any thing');
    expect(storage(key)).toEqual(expect.anything());
    storage(key, null);
    expect(storage(key)).toBe(undefined);
  });

  test('invalid params', () => {
    expect(storage('')).toBe(undefined);
    expect(storage(null)).toBe(undefined);
    expect(storage(false)).toBe(undefined);
    expect(storage(undefined)).toBe(undefined);
    expect(storage(NaN)).toBe(undefined);
  });
});

describe('showModal/showToast', () => {
  test('alert', () => {
    expect(alert('搞错了吧')).toEqual(expect.any(Promise));
    return expect(alert('搞错了吧')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
  });

  test('alert with options', () => {
    expect(alert('请开启授权', {
      title: '提醒',
      success: wx.openSetting,
    })).toEqual(expect.any(Promise));

    alert('请开启授权', {
      title: '提醒',
      success(res) {
        expect(res).toEqual({ errMsg: expect.stringMatching(/ok$/) });
      },
      fail(err) {
        expect(err).toEqual({ errMsg: expect.stringMatching(/fail$/) });
      },
    });
  });

  test('confirm', () => {
    expect(confirm('有没有搞错')).toEqual(expect.any(Promise));
    return expect(confirm('有没有搞错')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
  });

  test('confirm with options', () => {
    expect(confirm('请打开设置页开启授权', {
      confirmText: '打开',
      success(res) {
        if (res.confirm) wx.openSetting();
      },
    })).toEqual(expect.any(Promise));

    confirm('请打开设置页开启授权', {
      confirmText: '打开',
      success(res) {
        expect(res).toEqual({ errMsg: expect.stringMatching(/ok$/) });
      },
      fail(err) {
        expect(err).toEqual({ errMsg: expect.stringMatching(/fail$/) });
      },
    });
  });

  test('block', () => {
    expect(block('bingo')).toEqual(expect.any(Promise));
    return expect(block('bingo')).resolves.toBe(undefined);
  });

  test('toast', () => {
    setCurrentPages();
    expect(toast('huuuuurrah')).toEqual(expect.any(Promise));
    setCurrentPages(pageStack);
    return expect(toast('huuuuurrah')).resolves.toEqual({ errMsg: expect.stringMatching(/ok$/) });
  });
});

describe('linkTo', () => {
  test('first set', () => {
    setCurrentPages(pageStack);
    expect(getPage().route).toMatch(/list/);
    expect(getCurrentPages()).toHaveLength(2);
  });

  test('navigateTo', () => {
    linkTo('index');
    expect(getPage().route).toMatch(/^pages\/index\/index/);
    expect(getCurrentPages()).toHaveLength(3);

    linkTo('product');
    linkTo('detail');
    linkTo('index', 'redirect');
    expect(getPage().route).toMatch(/index/);
    expect(getCurrentPages()).toHaveLength(5);
  });

  test('页面栈溢出', () => {
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
  });

  test('reLaunch', () => {
    linkTo('index', 'reLaunch');
    expect(getPage().route).toMatch(/index/);
    expect(getCurrentPages()).toHaveLength(1);
  });

  test('redirectTo', () => {
    linkTo('index', { a: 1, b: 2 }, 'redirect');
    expect(getPage().route).toMatch(/index/);
    expect(getPage().query).toEqual({ a: 1, b: 2 });
  });

  test('非标准路径', () => {
    linkTo('pages/list/index', 'navigate');
    expect(getPage().route).toMatch(/^pages\/list\/index/);
    expect(getCurrentPages()).toHaveLength(2);

    linkTo('/common/fail/fail');
    expect(getPage().route).toMatch(/fail/);
    expect(getCurrentPages()).toHaveLength(3);

    linkTo('fail/fail');
    expect(getPage().route).toMatch(/^pages\/fail\/fail/);
  });

  test('with query string', () => {
    linkTo('index?bingo=1', { a: 1, b: { c: 3, d: 4 } });
    expect(getPage().route).toMatch(/^pages\/index\/index/);
    expect(getPage().query).toEqual({ a: 1, b: '{"c":3,"d":4}', bingo: 1 });
  });
});

describe('getSystemInfo', () => {
  expect.extend({
    toBeSomeValue(received, ...args) {
      const pass = args.includes(received);
      if (pass) {
        return {
          message: () => `expected ${received} not to be some value of ${args}`,
          pass: true,
        };
      }
      return {
        message: () => `expected ${received} to be some value of ${args}`,
        pass: false,
      };
    },
  });

  test('获取系统信息', () => {
    expect(getSystemInfo()).toMatchObject({
      titleBarHeight: expect.toBeSomeValue(44, 48),
      pxRatio: expect.any(Number),
      systemName: expect.toBeSomeValue('android', 'ios'),
      isIPhoneX: expect.any(Boolean),
      brand: expect.any(String),
    });
  });
});
