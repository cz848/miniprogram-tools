let pageStack = [];

global.getCurrentPages = () => pageStack;
global.setCurrentPages = stack => {
  pageStack = stack;
};

wx.version = { version: '2.8.2' };

const toJSON = params => {
  if (!params) return {};
  const query = params.split('&');
  return query.reduce((acc, q) => {
    const [key, value] = q.split('=');
    acc[key] = Number.isNaN(+value) ? value : +value;
    return acc;
  }, {});
};

const jump = (type, { url = '', success = () => {}, fail = () => {} }) => {
  const pages = getCurrentPages();
  if (!pages.length || !url) {
    fail({
      errMsg: `${type}:fail`,
    });
    return;
  }
  const [path, params] = url.slice(1).split('?');
  const query = toJSON(params);
  const newPage = {
    route: path,
    query,
    data: {},
    hideLoading() {},
  };

  if (type === 'navigateTo') {
    setCurrentPages(pages.concat(newPage));
  } else if (type === 'redirectTo') {
    pages[pages.length - 1] = newPage;
    setCurrentPages(pages);
  } else if (type === 'reLaunch') {
    setCurrentPages([newPage]);
  } else if (type === 'switchTab') {
    setCurrentPages([newPage]);
  }
  success({
    errMsg: `${type}:ok`,
  });
};

wx.navigateTo = (options = {}) => {
  jump('navigateTo', options);
};
wx.redirectTo = (options = {}) => {
  jump('redirectTo', options);
};
wx.reLaunch = (options = {}) => {
  jump('reLaunch', options);
};
wx.switchTab = (options = {}) => {
  jump('switchTab', options);
};
wx.navigateBack = (options = {}) => {
  const {
    delta = 1,
    success = () => {},
    fail = () => {},
  } = options || {};
  const pages = getCurrentPages();
  if (!pages.length) {
    fail({
      errMsg: 'navigateBack:fail',
    });
    return;
  }
  setCurrentPages(pages.slice(0, Math.max(0, pages.length - delta)));
  success({
    errMsg: 'navigateBack:ok',
  });
};
