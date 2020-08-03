# 小程序通用函数库miniprogram-tools

## 文件结构

- config.js ⇒ 几个基本配置
- utils.js ⇒ 与小程序不相关的基础函数
- weapp.js ⇒ 与小程序相关的应用级工具函数
- index.js ⇒ 整合前面的文件统一输出所有api

## 安装与使用

```bash
npm install @tylerchao/miniprogram-tools
```

```javascript
import {
  compareVersions,
  mp,
  alert,
  confirm,
  toast,
  getSystemInfo,
  linkTo,
  storage,
} from '@tylerchao/miniprogram-tools';

import { isEmpty, isPlainObject } from '@tylerchao/miniprogram-tools/utils';
```

## API

- [config.js](#config)
- utils.js
  + [isPlainObject](#isPlainObject)
  + [isEmptyObject](#isEmptyObject)
  + [isEmptyArray](#isEmptyArray)
  + [isEmpty](#isEmpty)
  + [getKeys](#getKeys)
  + [removeEmptyValues](#removeEmptyValues)
  + [clone](#clone)
  + [capitalize](#capitalize)
  + [toQueryString](#toQueryString)
  + [generateSignature](#generateSignature)
  + [compareVersions](#compareVersions)
  + [sleep](#sleep)
- weapp.js
  + [promisify](#promisify)
  + [mp](#mp)
  + [getPage](#getPage)
  + [storage](#storage)
  + [alert](#alert)
  + [confirm](#confirm)
  + [block](#block)
  + [toast](#toast)
  + [linkTo](#linkTo)
  + [getSystemInfo](#getSystemInfo)

### <a id="config">config.js</a>:

**PREFIX**: storage存储键需要的前缀，除非小程序不支持getAccountInfoSync(基础库v2.2.2以下)，否则不需要自定义，如有特殊需求，按以下方式更新：

```javascript
storage.updatePrefix(PREFIX: String);
```

**WX_APIS**: 配置需要Promise化的以wx开头的小程序api，这里只配置了`showToast`/`showModal`/`request`三个wx api，其它的需要在用到的地方先执行：

```javascript
mp.add(apiList: Array);
```

### utils.js

**<a id="isPlainObject">isPlainObject</a>(input: any)**: 判断是否为键值对形式的纯对象

```javascript
isPlainObject({}) // true
isPlainObject({ a: 1, b: 2, c: x => x * x }) // true
isPlainObject(true) // false
isPlainObject(null) // false
isPlainObject('plain') // false
```

**<a id="isEmptyObject">isEmptyObject</a>(input: any)**: 判断是否为"空纯对象"

```javascript
isEmptyObject({}) // true
isEmptyObject(null) // false
isEmptyObject({ a: 1 }) // false
isEmptyObject(false) // false
isEmptyObject('') // false
```

**<a id="isEmptyArray">isEmptyArray</a>(input: any)**: 判断是否为"空数组"

```javascript
isEmptyArray([]) // true
isEmptyArray(['']) // false
isEmptyArray(false) // false
isEmptyArray('') // false
isEmptyArray({}) // false
```

**<a id="isEmpty">isEmpty</a>(input: any, inclusions?: Array, exclusions?: Array)**: 判断是否为空值

默认定义`''`, `null`, `undefined`, `'undefined'`,`[]`, `{}` 几种为空值的情况。

- `inclusions`: 其它做为空值的情况
- `exclusions`: 排除以上无需判断为空值的情况

```javascript
isEmpty('') // true
isEmpty(undefined) // true
isEmpty('undefined') // true
isEmpty(false) // false
isEmpty([]) // true
isEmpty({}) // true
isEmpty(false, [false]) // true
isEmpty(null, [], [null]) // false
```

**<a id="getKeys">getKeys</a>(input: Object | Array)**: 过滤出对象或数组中有值的键并返回包含这些键的数组

```javascript
getKeys({ a: 1, b: '', c: null, d: false }) // ["a", "d"]
```

**<a id="removeEmptyValues">removeEmptyValues</a>(input: Object | Array)**: 删除对象或数组中属性值为空值、空数组、空对象的键

```javascript
removeEmptyValues({ a: 1, b: '', c: null, d: false }) // {a: 1, d: false}
removeEmptyValues([0, 1, '', { c: 1, d: null }, { e: '' }]) // [0, 1, { c: 1 }]
```

**<a id="clone">clone</a>(input: Object | Array, keys?: Array | Function)**: 实现深拷贝json数据的最简单版本，可以选择只拷贝某些键值

- `keys`: 如果该参数是一个数组，则只有包含在这个数组中的属性名才会被克隆；如果该参数是一个函数，则在克隆过程中，被克隆的值的每个属性都会经过该函数的转换和处理；属性值为`undefined`以及函数的属性名不会被克隆

```javascript
clone({ a: 1, b: '', c: null, d: false, e: undefined }) // {a: 1, b: "", c: null, d: false}
clone({ a: 1, b: '', c: null, d: false }, ['a', 'b', 'c']) // {a: 1, b: "", c: null}
```

**<a id="capitalize">capitalize</a>(input: String, prefix?: String)**: 首字母大写

- `prefix`: 前缀，放在首字母前面

```javascript
capitalize('prefix suffix') // Prefix suffix
capitalize('prefix', 'suffix') // suffixPrefix
```

**<a id="toQueryString">toQueryString</a>(input: Object, encode?: Boolean, sort?: Boolean)**: 转换纯对象为url查询字符串

- `encode`: 是否对属性值进行URL编码
- `sort`: 是否对属性名进行排序

```javascript
toQueryString({ c: 1, b: '', d: null, a: false, f: undefined }) // c=1&a=false
toQueryString({ c: 1, b: '', d: null, a: false, f: '中文' }, true) // c=1&a=false&f=%E4%B8%AD%E6%96%87
toQueryString({ c: 1, b: '', d: null, a: false, f: undefined }, false, true) // a=false&c=1
```

**<a id="generateSignature">generateSignature</a>(input: Object, { encrypt: Function, isSorted?: Boolean, appKey?: String, token?: String, secret?: String })**: 生成签名算法

- `encrypt`: 加密函数，一般需自行引入sha256
- `isSorted`: 是否需要对 input 排序
- `appKey`: 公共参数，应用的appKey
- `token`: 公共参数，用户身份凭证
- `secret`: 要添加到最后的secret字符串

```javascript
import sha256 from 'js-sha256';

generateSignature({c: 1, b: '', d: null, a: false, f: undefined }, { encrypt: sha256 });

generateSignature({ c: 1, b: '', d: null, a: false, f: '中文' }, {
  encrypt: sha256,
  isSorted: false,
  appKey: 'xwrlt456',
  secret: 'xxxxx',
});
```

**<a id="compareVersions">compareVersions</a>(v1: String, op: String, v2: String)**: 比较两个版本号大小，经常用于比较是否低于某个版本的基础库。
- `v1/v2`: 要比较的版本号
- `op`: 比较运算符，可用的有`>`,`<`,`=`,`>=`,`<=`

```javascript
compareVersions('2.5.0', '=', '2.4.9') === false
compareVersions('v2.10.1', '>', 'v2.9.1') === true
compareVersions('v2.10.1-alpha.2', '>', '2.10.1-alpha.1') === true
compareVersions('v2.10.1-alpha.2', '>', '2.10.1-beta.1') === true
compareVersions('v2.10.1-alpha.2', '>=', '2.10.1-beta.1') === true
```

**<a id="sleep">sleep</a>**: 等待n毫秒

```javascript
(async () => {
  console.log('a');
  await sleep(5000);
  console.log('b');
})();
```

### weapp.js

**<a id="promisify">promisify</a>**: 任何类似wx开头的api，以`success`和`fail`作为回调的函数，都可以用此方式Promise化。

```javascript
const request = promisify(wx.request);

request({ data }).then(res => {
  // ...
}).catch(console.error);

const res = await request({ data }).catch(e => e);
console.log(res);
```

**<a id="mp">mp</a>**: 小程序wx对象经Promise化后的对象，项目中使用到的以wx开头的api需要在使用到的地方调用`mp.addApis`方法先定义，也可以统一在一个地方定义，请按需配置
**注：**小程序基础库2.10.2以上部分异步api支持promise调用方式，此时返回原生的promise。

**mp.apiList**: 查询已被mp对象promisify过的wx api，可以知道有哪些API已被定义;

```javascript
console.log(mp.apiList);
```

**mp.add(apiList: Array)**: 按需添加需要Promisify化的wx api，或在`app.js`中统一添加小程序中用到的wx api。

```javascript
mp.add(['login', 'getLocation']);

mp.login().then(res => {
  ...
});
```

```javascript
mp.request({ data })
  .then(res => {
    ...
  })
  .catch(console.error);

const res = await mp.request({ data }).catch(e => e);
console.log(res);
```

**<a id="getPage">getPage</a>(previous?: Number)**: 获取当前页面栈中的页面

- `previous`:  相对于当前页面的索引，负数

```javascript
getPage()
getPage(-1)
```

**<a id="storage">storage</a>(key?: String, value?: Any, expire?: Number)**: 小程序本地存储

```javascript
storage('key') // 读取key存储的数据
storage('key', null, true) //　读取数据的有效期
storage('key', 'value') // 存储数据
storage('key', null) //　删除数据
storage('key', 'value', -1) //　删除数据
storage('key', 'value', 3600) // 存储数据，有效期为1个小时
```

**storage.updatePrefix(prefix: String)**: 改变storage存储键的前缀，默认为小程序的appid和当前环境，一般无需改变。

```javascript
storage.updatePrefix(appid + env);
```

**<a id="alert">alert</a>(content: String, options?: Object)**: 警告对话框（对模态对话框的进一步封装，并Promise化）

- `options`: 同showModal的选项

```javascript
alert('警告：');
await alert('警告：');
```

**<a id="confirm">confirm</a>(content: String, options?: Object)**: 确认对话框（对模态对话框的进一步封装，并Promise化）

- `options`: 同showModal的选项

```javascript
confirm('警告：');
const res = await confirm('警告：');
if (res.confirm) {
  ...
}
```

**<a id="block">block</a>(content: String, options?: Object)**: 带返回的对话框（对模态对话框的进一步封装，并Promise化）

点击返回之后，直接返回到上一页。

- `options`: 同showModal的选项

```javascript
block('此商品已下架。');
```

**<a id="toast">toast</a>(title: String, icon?: String)**: 消息提示框（对showToast的进一步封装，并Promise化）

- icon: 小程序内置的几种图标

```javascript
toast('加载失败，请重试');
toast('加载成功', 'success');
```

**<a id="linkTo">linkTo</a>(path: String, query?: Object | String, openType?: String)**: 跳转页面

- `path`: 默认为页面放在`pages`目录，并且页面文件夹与页面同名，这时只需写文件名，否则请写绝对路径。
- `query`: 如果传入Object则会处理为url查询字符串，如果传入String则作用同`jumpType`。
- `openType`: 跳转方式，支持`navigate/navigateTo`,`redirect/redirectTo`,`swithTab`,`reLaunch`，默认为`navigateTo`跳转方式。
- 注：如果页面栈中的页面超过10个，会自动转为`redirectTo`跳转方式。

```javascript
linkTo('index'); // 默认不需要带路径
linkTo('index', 'redirect');
linkTo('pages/fail/fail');
linkTo('/common/fail/fail');
linkTo('coupon', {
  id: 1,
  type,
}, 'reLaunch');
```

**<a id="getSystemInfo">getSystemInfo</a>**: 获取所有系统参数（同`wx.getSystemInfoSync`），并加入几个有用的字段，如下：

- `titleBarHeight`: 标题栏高度
- `systemName`: 当前系统的名字，全小写
- `pxRatio`: 根据屏幕宽度计算得到的px比率
- `isIPhoneX`: 是否为iPhoneX以上机型
