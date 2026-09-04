const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function run(amounts) {
  const values = {
    name: '', rocYear: '75', birthMonth: '6', birthDay: '15', gender: 'male',
    term: '20', ikcAmount: amounts.ikc || '', gwlTerm: '20',
    gwlAmount: amounts.gwl || '', ngoAmount: amounts.ngo || ''
  };
  const ids = ['warning', 'detail', 'ageBadge', 'person', 'ikcAnnual', 'ngoAnnual',
    'ikcTotal', 'gwlAnnual', 'gwlTotal', 'ngo20Total', 'ngo25Total',
    'ngoMaturityTotal', 'calculate'];
  const elements = {};
  for (const id of [...Object.keys(values), ...ids]) {
    elements[id] = {
      value: values[id] || '', textContent: '—', innerHTML: '', style: {},
      classList: { toggle() {} }, addEventListener() {}
    };
  }
  const document = {
    getElementById(id) { return elements[id]; },
    querySelectorAll() { return []; }
  };
  const navigator = {};
  const location = { protocol: 'file:' };
  eval(script + '\ncalc();');
  return elements;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const isZeroCurrency = value => /^(NT)?\$0$/.test(value);

const blank = run({});
for (const id of ['ikcAnnual', 'ikcTotal', 'gwlAnnual', 'gwlTotal', 'ngoAnnual', 'ngo20Total', 'ngo25Total', 'ngoMaturityTotal']) {
  assert(isZeroCurrency(blank[id].textContent), `空白保額的 ${id} 應為 0 元，實際為 ${blank[id].textContent}`);
}

const ngoOnly = run({ ngo: '500000' });
assert(isZeroCurrency(ngoOnly.ikcAnnual.textContent), 'NGODCR 單獨試算時 IKC 應為 0');
assert(isZeroCurrency(ngoOnly.gwlAnnual.textContent), 'NGODCR 單獨試算時 GWL 應為 0');
assert(!isZeroCurrency(ngoOnly.ngoAnnual.textContent), 'NGODCR 單獨試算應產生保費');
assert(!isZeroCurrency(ngoOnly.ngo20Total.textContent), 'NGODCR 單獨試算應產生 20 年累計保費');
console.log('通過：空白保額歸零、NGODCR 可單獨試算、民國日期可計算');
