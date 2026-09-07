const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(__dirname + '/../script.js', 'utf8');
const context = vm.createContext({ window: { addEventListener() {} } });
vm.runInContext(source, context);
test('local dates follow Bangkok across midnight', () => {
  process.env.TZ = 'Asia/Bangkok';
  assert.equal(vm.runInContext("localDateString(new Date('2026-09-06T17:01:00Z'))", context), '2026-09-07');
});
test('legacy backup accepted; malformed imports rejected before replacement', () => {
  vm.runInContext('seedInitialBettingData()', context);
  const backup = JSON.parse(vm.runInContext('JSON.stringify(ledgerState)', context));
  assert.equal(context.validateBackup(backup), backup);
  for (const patch of [{ gross: null }, { date: '2026-02-30' }, { commPct: 101 }, { channelId: 99 }]) {
    const invalid = structuredClone(backup);
    Object.assign(invalid.transactions[0], patch);
    assert.throws(() => context.validateBackup(invalid));
  }
});
test('modal can reopen repeatedly and binds only the newest action', () => {
  function button() {
    return { textContent: '', handlers: [], cloneNode() { return button(); }, addEventListener(_, fn) { this.handlers.push(fn); } };
  }
  const parent = { replaceChild(next, previous) { assert.equal(previous.parentNode, this); previous.parentNode = null; next.parentNode = this; } };
  const primary = button(), secondary = button(); primary.parentNode = secondary.parentNode = parent;
  const c = vm.createContext({ modalBtnPrimary: primary, modalBtnSecondary: secondary, modalTitle: {}, modalDesc: {}, modalTextarea: {}, modalFileInputContainer: {style:{}}, modalFileInput: {}, modal: {style:{}}, sounds:{playClick(){}}, count:0 });
  vm.runInContext(source.slice(source.indexOf('  function openModal('), source.indexOf('  function closeModal(')), c);
  for(let i=0;i<3;i++) {
    vm.runInContext("openModal({title:'Test', onPrimaryClick:()=>count++})", c);
    assert.equal(c.modalBtnPrimary.handlers.length,1);
    c.modalBtnPrimary.handlers[0]();
  }
  assert.equal(c.count,3);
});
test('service worker prefers network and falls back offline without deleting unrelated caches', async () => {
  const handlers = {}, deleted = [];
  let offline = false;
  const cache = { put:async()=>{}, match:async()=>new Response('cached') };
  const c = vm.createContext({ URL, Response, fetch:async()=>{if(offline) throw Error('offline'); return new Response('fresh');}, caches:{open:async()=>cache,keys:async()=>['other-app','boxing-ledger-cache-v4','boxing-ledger-cache-v5'],delete:async key=>deleted.push(key)}, self:{location:{origin:'https://example.com'},registration:{scope:'https://example.com/boxing-ledger/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn} });
  vm.runInContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),c);
  let activation; handlers.activate({waitUntil:p=>activation=p}); await activation;
  assert.deepEqual(deleted,['boxing-ledger-cache-v4']);
  for (const expected of ['fresh','cached']) {
    let result; const waits=[];
    handlers.fetch({request:{url:'https://example.com/boxing-ledger/script.js',method:'GET'},waitUntil:p=>waits.push(p),respondWith:p=>result=p});
    assert.equal(await (await result).text(),expected); await Promise.all(waits); offline=true;
  }
});
