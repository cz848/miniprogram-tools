let pageStack = [];

global.getCurrentPages = () => pageStack;
global.setCurrentPages = stack => {
  pageStack = stack || [];
};

wx.version = { version: '2.8.2' };

const toJSON = params => {
  if (!params) return {};
  return params.split('&').reduce((acc, q) => {
    const [key, value] = q.split('=');
    acc[key] = Number.isNaN(+value) ? value : +value;
    return acc;
  }, {});
};

const jump = (type, { url = '', delta = 1, success = () => {}, fail = () => {} }) => {
  let pages = getCurrentPages();
  if (type !== 'navigatorBack' && !url) {
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
    pages.push(newPage)
  } else if (type === 'redirectTo') {
    // pages.pop();
    // pages.push(newPage);
    pages[pages.length - 1] = newPage;
  } else if (type === 'reLaunch' || type === 'switchTab') {
    pages = [newPage];
  } else if (type === 'navigateBack') {
    pages.pop();
  }
  setCurrentPages(pages);
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
  jump('navigateBack', options);
};
