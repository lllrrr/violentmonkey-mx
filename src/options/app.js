import 'src/common/polyfills';
import 'src/common/browser';
import 'src/common/sprite';
import Vue from 'vue';
import { sendMessage, i18n, getLocaleString } from 'src/common';
import options from 'src/common/options';
import getPathInfo from 'src/common/pathinfo';
import handlers from 'src/common/handlers';
import 'src/common/ui/style';
import { store } from './utils';
import App from './views/app';

Vue.prototype.i18n = i18n;

Object.assign(store, {
  loading: false,
  cache: {},
  scripts: [],
  sync: [],
  route: null,
});
zip.workerScriptsPath = '/public/lib/zip.js/';
initialize();

function loadHash() {
  store.route = getPathInfo();
}

function initialize() {
  document.title = i18n('extName');
  window.addEventListener('hashchange', loadHash, false);
  loadHash();
  initMain();
  options.ready(() => {
    new Vue({
      render: h => h(App),
    }).$mount('#app');
  });
}

function initSearch(script) {
  const meta = script.meta || {};
  script._search = [
    meta.name,
    getLocaleString(meta, 'name'),
    meta.description,
    getLocaleString(meta, 'description'),
    script.custom.name,
    script.custom.description,
  ].filter(Boolean).join('\n').toLowerCase();
}

function loadData() {
  sendMessage({ cmd: 'GetData' })
  .then(data => {
    [
      'cache',
      'scripts',
      'sync',
    ].forEach(key => {
      Vue.set(store, key, data[key]);
    });
    if (store.scripts) {
      store.scripts.forEach(initSearch);
    }
    store.loading = false;
  });
}

function initMain() {
  store.loading = true;
  loadData();
  Object.assign(handlers, {
    ScriptsUpdated: loadData,
    UpdateSync(data) {
      store.sync = data;
    },
    AddScript(data) {
      data.message = '';
      initSearch(data);
      store.scripts.push(data);
    },
    UpdateScript(data) {
      if (!data) return;
      const script = store.scripts.find(item => item.id === data.id);
      if (script) {
        Object.keys(data).forEach(key => {
          Vue.set(script, key, data[key]);
        });
        initSearch(script);
      }
    },
    RemoveScript(data) {
      const i = store.scripts.findIndex(script => script.id === data);
      if (i >= 0) store.scripts.splice(i, 1);
    },
  });
}
