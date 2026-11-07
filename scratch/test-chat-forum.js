const fs = require('fs');

global.window = {};
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { querySelector: () => null };
global.CATS = ['Elektronik','Dokumen / Kartu','Tas / Dompet','Kunci','Pakaian / Aksesoris','Alat Tulis','Lainnya'];
global.CATS_DYNAMIC = [];
global.API = {};
global.FVP = { pin:'', cal:'', user:'', out:'', search:'', box:'' };
global.fvI = () => '';
global.fvCatIcon = () => '';
global.fvChip = () => '';
global.fmt = () => '';
global.fmtClock = (x) => new Date(x).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const path = require('path');
const utilsCode = fs.readFileSync(path.join(__dirname, '../frontend/js/01-utils.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../frontend/js/03-store.js'), 'utf8');
const forumCode = fs.readFileSync(path.join(__dirname, '../frontend/js/dashboard/view-forum.js'), 'utf8');

const vm = require('vm');
vm.runInThisContext(utilsCode);
vm.runInThisContext(storeCode);
vm.runInThisContext(forumCode);

// Test 1: Sorting conversation list
DB.users = [
  { id: 1, name: 'Budi Santoso', role: 'user', nim: '101', prodi: 'IF' },
  { id: 2, name: 'Siti Aminah', role: 'user', nim: '102', prodi: 'SI' },
  { id: 3, name: 'Ahmad Dahlan', role: 'user', nim: '103', prodi: 'TI' }
];

DB.msgs = [
  { id: 1, uid: 1, from: 'user', text: 'Pesan lama Budi', at: '2026-10-28 08:00:00', read: true },
  { id: 2, uid: 2, from: 'user', text: 'Pesan Siti kemarin', at: '2026-10-27 10:00:00', read: true }
  // Ahmad has no messages
];

let sorted = getSortedStudentsForAdmin();
console.log('Test 1 (Initial Sort):', sorted.map(u => u.name));
if (sorted[0].id !== 1 || sorted[1].id !== 2 || sorted[2].id !== 3) {
  console.error('Test 1 Failed');
  process.exit(1);
}

// Test 2: Ahmad sends a new message NOW
DB.msgs.push({ id: 3, uid: 3, from: 'user', text: 'Pesan BARU Ahmad', at: '2026-10-28 23:30:00', read: false });
sorted = getSortedStudentsForAdmin();
console.log('Test 2 (Ahmad sends new msg):', sorted.map(u => u.name));
if (sorted[0].id !== 3) {
  console.error('Test 2 Failed: Ahmad should be at index 0');
  process.exit(1);
}

// Test 3: Admin replies to Siti
DB.msgs.push({ id: 4, uid: 2, from: 'admin', text: 'Halo Siti balasan admin', at: '2026-10-28 23:35:00', read: true });
sorted = getSortedStudentsForAdmin();
console.log('Test 3 (Admin replies to Siti):', sorted.map(u => u.name));
if (sorted[0].id !== 2) {
  console.error('Test 3 Failed: Siti should now be at index 0');
  process.exit(1);
}

// Test 4: Forum card button text for Admin vs Regular User
ST.user = { role: 'admin' };
const cardAdmin = fvForumCard({ id: 10, name: 'Dompet', cat: 'Tas / Dompet', loc: 'Perpus', date: '2026-10-28' }, 'lost');
console.log('Test 4 (Admin card button text contains Chat Pelapor):', cardAdmin.includes('<small>Chat Pelapor</small>'));
if (!cardAdmin.includes('<small>Chat Pelapor</small>')) {
  console.error('Test 4 Failed: Expected Chat Pelapor for Admin');
  process.exit(1);
}

ST.user = { role: 'user' };
const cardUser = fvForumCard({ id: 10, name: 'Dompet', cat: 'Tas / Dompet', loc: 'Perpus', date: '2026-10-28' }, 'lost');
console.log('Test 5 (Student card button text contains Chat Admin):', cardUser.includes('<small>Chat Admin</small>'));
if (!cardUser.includes('<small>Chat Admin</small>')) {
  console.error('Test 5 Failed: Expected Chat Admin for Student');
  process.exit(1);
}

ST.user = null;
const cardGuest = fvForumCard({ id: 10, name: 'Dompet', cat: 'Tas / Dompet', loc: 'Perpus', date: '2026-10-28' }, 'lost');
console.log('Test 6 (Guest card button text contains Chat Admin):', cardGuest.includes('<small>Chat Admin</small>'));
if (!cardGuest.includes('<small>Chat Admin</small>')) {
  console.error('Test 6 Failed: Expected Chat Admin for Guest');
  process.exit(1);
}

console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
