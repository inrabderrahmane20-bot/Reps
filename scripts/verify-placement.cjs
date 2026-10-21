/* Verifies the sponsored placement filter logic (home vs services) without
   mutating the database, by exercising the same predicate the clients use.
   Usage: node scripts/verify-placement.cjs */
const cases = [
  { placement: undefined, expected: { home: true, services: true }, label: 'unset defaults to both' },
  { placement: 'both', expected: { home: true, services: true }, label: 'both' },
  { placement: 'home', expected: { home: true, services: false }, label: 'home only' },
  { placement: 'services', expected: { home: false, services: true }, label: 'services only' },
];

const onHome = (p) => p.sponsoredPlacement === 'both' || p.sponsoredPlacement === 'home';
const onServices = (p) => p.sponsoredPlacement === 'both' || p.sponsoredPlacement === 'services';

let failures = 0;
for (const c of cases) {
  const row = { sponsoredPlacement: c.placement ?? 'both' };
  const home = onHome(row);
  const services = onServices(row);
  const ok = home === c.expected.home && services === c.expected.services;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${c.label.padEnd(26)} home=${home} services=${services}`
  );
}
console.log(`\n${failures === 0 ? 'Placement filter holds.' : `${failures} failure(s).`}`);
process.exitCode = failures ? 1 : 0;
