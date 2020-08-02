import { mp, storage } from '../../../weapp';

Component({
  properties: {
    prop: {
      type: String,
      value: 'index.properties',
    },
  },
  attached() {
    this.mp = mp;
    mp.add(['login']);
    this.login();
    storage('abcde', 12345);
    storage.updatePrefix('wehrwelr');
    storage('abcde', 56789);
  },

  methods: {
    async login() {
      const res = await mp.login().catch(e => e);
      storage('js_code', res.code);
    },
  },
});
