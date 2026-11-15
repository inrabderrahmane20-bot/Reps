// Local JSON-store backup and non-destructive restore. Never connects to production.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const checksum = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function backup(sourceDirectory, archivePath) {
  const root = path.resolve(sourceDirectory);
  const entries = [];
  function add(relative) {
    const file = path.join(root, relative);
    const info = fs.lstatSync(file);
    if (info.isSymbolicLink()) throw new Error('Symbolic links cannot be backed up.');
    if (info.isDirectory()) for (const name of fs.readdirSync(file)) add(path.join(relative, name));
    else {
      const bytes = fs.readFileSync(file);
      entries.push({ path: relative.split(path.sep).join('/'), sha256: checksum(bytes), data: bytes.toString('base64') });
    }
  }
  JSON.parse(fs.readFileSync(path.join(root, 'db.json'), 'utf8'));
  add('db.json');
  if (fs.existsSync(path.join(root, 'visual-editor'))) add('visual-editor');
  const archive = { format: 'annabid-local-backup-v1', createdAt: new Date().toISOString(), entries };
  fs.writeFileSync(archivePath, JSON.stringify(archive), { flag: 'wx', mode: 0o600 });
}

function restore(archivePath, targetDirectory) {
  const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  if (archive.format !== 'annabid-local-backup-v1' || !Array.isArray(archive.entries)) throw new Error('Unsupported backup.');
  const root = path.resolve(targetDirectory);
  if (fs.existsSync(root) && fs.readdirSync(root).length) throw new Error('Restore requires a new or empty directory.');
  const seen = new Set();
  const files = archive.entries.map(entry => {
    if (typeof entry.path !== 'string' || /[\\:]/.test(entry.path) || entry.path.startsWith('/') || entry.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe backup path.');
    if (seen.has(entry.path)) throw new Error('Duplicate backup path.');
    seen.add(entry.path);
    const target = path.resolve(root, entry.path);
    if (!target.startsWith(root + path.sep)) throw new Error('Backup path escapes the restore directory.');
    const bytes = Buffer.from(entry.data, 'base64');
    if (checksum(bytes) !== entry.sha256) throw new Error('Backup checksum mismatch.');
    if (entry.path === 'db.json') JSON.parse(bytes.toString('utf8'));
    return { target, bytes };
  });
  if (!seen.has('db.json')) throw new Error('Backup has no database.');
  fs.mkdirSync(root, { recursive: true });
  for (const { target, bytes } of files) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });
  }
}
module.exports = { backup, restore };
if (require.main === module) {
  const [command, source, target] = process.argv.slice(2);
  if (!source || !target || !['backup', 'restore'].includes(command)) throw new Error('Usage: node scripts/backup-local.cjs backup <data-directory> <new-archive.json> | restore <archive.json> <empty-directory>');
  ({ backup, restore })[command](source, target);
  console.log(command + ' completed: ' + path.resolve(target));
}
