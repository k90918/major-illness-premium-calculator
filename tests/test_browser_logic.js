const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function run(amounts, overrides = {}) {
  const values = {
    name: '', rocYear: '75', birthMonth: '6', birthDay: '15', gender: 'male',
    term: '20', ijsbAmount: amounts.ijsb || '', gwlTerm: '20',
    gwlAmount: amounts.gwl || '', ngoAmount: amounts.ngo || '',
    ...overrides
  };
  const ids = ['warning', 'detail', 'ageBadge', 'person', 'insuranceAge', 'ageCountdown', 'ijsbAnnual', 'ngoAnnual',
    'ijsbTotal', 'gwlAnnual', 'gwlTotal', 'ngo20Total', 'ngo25Total',
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
  eval(script + "\ncalc(); elements._insurance = insuranceAgeOn(rocBirthDate()); elements._oneNgoUnit = money(NGO[document.getElementById('gender').value][elements._insurance.insuranceAge]); elements._fixedBefore = insuranceAgeOn(new Date(2000,0,1), new Date(2026,6,1)); elements._fixedIncreaseDay = insuranceAgeOn(new Date(2000,0,1), new Date(2026,6,2)); elements._ijsbLengths = [10,15,20,30].map(term => [IJSB[term].male.length, IJSB[term].female.length]);");
  return elements;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const isZeroCurrency = value => /^(NT)?\$0$/.test(value);

const blank = run({});
for (const id of ['ijsbAnnual', 'ijsbTotal', 'gwlAnnual', 'gwlTotal', 'ngoAnnual', 'ngo20Total', 'ngo25Total', 'ngoMaturityTotal']) {
  assert(isZeroCurrency(blank[id].textContent), `空白保額的 ${id} 應為 0 元，實際為 ${blank[id].textContent}`);
}

const ngoOnly = run({ ngo: '1' });
assert(isZeroCurrency(ngoOnly.ijsbAnnual.textContent), 'NGODCR 單獨試算時 IJSB 應為 0');
assert(isZeroCurrency(ngoOnly.gwlAnnual.textContent), 'NGODCR 單獨試算時 GWL 應為 0');
assert(!isZeroCurrency(ngoOnly.ngoAnnual.textContent), 'NGODCR 單獨試算應產生保費');
assert(!isZeroCurrency(ngoOnly.ngo20Total.textContent), 'NGODCR 單獨試算應產生 20 年累計保費');
assert(ngoOnly.ngoAnnual.textContent === ngoOnly._oneNgoUnit, '輸入 1 應代表保額 1 萬元');
assert(JSON.stringify(ngoOnly._ijsbLengths) === JSON.stringify([[66,66],[61,61],[56,56],[46,46]]), 'IJSB 各年期費率筆數不正確');
assert(ngoOnly.insuranceAge.textContent === `${ngoOnly._insurance.insuranceAge} 歲`, '應顯示保險年齡');
assert(ngoOnly.ageCountdown.textContent === `${ngoOnly._insurance.daysToNextIncrease} 天`, '應顯示距保險年齡增加一歲的天數');
assert(ngoOnly._fixedBefore.actualAge === 26 && ngoOnly._fixedBefore.insuranceAge === 26, '滿六個月當天尚不應增加保險年齡');
assert(ngoOnly._fixedBefore.daysToNextIncrease === 1, '滿六個月當天應顯示倒數 1 天');
assert(ngoOnly._fixedIncreaseDay.insuranceAge === 27, '超過六個月的第一天應增加保險年齡');

const today = new Date();
const sevenMonthsAgo = new Date(today.getFullYear() - 40, today.getMonth() - 7, 1);
const insuranceAgePricing = run({ ngo: '1' }, {
  rocYear: String(sevenMonthsAgo.getFullYear() - 1911),
  birthMonth: String(sevenMonthsAgo.getMonth() + 1),
  birthDay: '1'
});
assert(insuranceAgePricing._insurance.insuranceAge === insuranceAgePricing._insurance.actualAge + 1, '超過生日六個月後保險年齡應進位');
assert(insuranceAgePricing.ngoAnnual.textContent === insuranceAgePricing._oneNgoUnit, '保費應依保險年齡查表');

const overAmount = run({ ijsb: '501' });
assert(overAmount.ijsbAnnual.textContent === '不適用', 'IJSB 超過 500 萬元時應顯示不適用');
assert(overAmount.warning.textContent.includes('最高 500 萬元'), 'IJSB 超過 500 萬元時應顯示保額限制');

const rocYearAge18 = String(today.getFullYear() - 1911 - 18);
const underAge = run({ ijsb: '100' }, { rocYear: rocYearAge18, birthMonth: String(today.getMonth() + 1), birthDay: String(today.getDate()) });
assert(underAge.ijsbAnnual.textContent === '不適用', '未滿 19 歲時 IJSB 應顯示不適用');
assert(underAge.warning.textContent.includes('最低投保年齡為 19 歲'), '未滿 19 歲時應顯示年齡限制');

const rocYearAge46 = String(new Date().getFullYear() - 1911 - 46);
const over30YearAge = run({ ijsb: '100' }, { term: '30', rocYear: rocYearAge46, birthMonth: '1', birthDay: '1' });
assert(over30YearAge.ijsbAnnual.textContent === '不適用', '46 歲投保 30 年期時應顯示不適用');
assert(over30YearAge.warning.textContent.includes('30 年期最高投保年齡為 45 歲'), '30 年期超齡時應顯示 45 歲限制');

const ngoOverAmount = run({ ngo: '301' });
assert(ngoOverAmount.ngoAnnual.textContent === '不適用', 'NGODCR 超過 300 萬元時應顯示不適用');
assert(ngoOverAmount.ngo20Total.textContent === '不適用', 'NGODCR 超額時累計保費應顯示不適用');
assert(ngoOverAmount.warning.textContent.includes('最高 300 萬元'), 'NGODCR 超過 300 萬元時應顯示保額限制');

const rocYearAge66 = String(new Date().getFullYear() - 1911 - 66);
const ngoOverAge = run({ ngo: '100' }, { rocYear: rocYearAge66, birthMonth: '1', birthDay: '1' });
assert(ngoOverAge.ngoAnnual.textContent === '不適用', '66 歲投保 NGODCR 時應顯示不適用');
assert(ngoOverAge.warning.textContent.includes('最高投保年齡為 65 歲'), 'NGODCR 超齡時應顯示 65 歲限制');
console.log('通過：IJSB 費率、空白保額歸零、NGODCR 單獨試算、民國日期');
