const fs = require('fs').promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const docs = path.join(root, 'docs');

async function rmrf(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

async function copy(srcPath, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  // use recursive copy when source is directory
  const stat = await fs.stat(srcPath);
  if (stat.isDirectory()) {
    await fs.mkdir(destPath, { recursive: true });
    const entries = await fs.readdir(srcPath);
    for (const entry of entries) {
      await copy(path.join(srcPath, entry), path.join(destPath, entry));
    }
  } else {
    await fs.copyFile(srcPath, destPath);
  }
}

async function replacePathsInFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');

  // Replace occurrences of ../ or ../../ or more with empty string for local asset paths
  // Do not touch absolute URLs (they don't contain ../)
  content = content.replace(/(\.{2}\/)+/g, '');

  await fs.writeFile(filePath, content, 'utf8');
}

async function walkAndReplace(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndReplace(full);
    } else if (/\.(html|css|js)$/i.test(entry.name)) {
      await replacePathsInFile(full);
    }
  }
}

async function build() {
  console.log('Preparing docs directory...');
  await rmrf(docs);
  await fs.mkdir(docs, { recursive: true });

  // copy html files
  const htmlSrc = path.join(src, 'html');
  const htmlDest = docs;
  await copy(htmlSrc, htmlDest);

  // copy assets directories
  const assets = ['css', 'js', 'images'];
  for (const a of assets) {
    const s = path.join(src, a);
    const d = path.join(docs, a);
    try {
      const stat = await fs.stat(s);
      if (stat.isDirectory()) {
        await copy(s, d);
      }
    } catch (e) {
      // ignore missing asset
    }
  }

  // Fix paths in copied files
  console.log('Fixing relative paths inside docs files...');
  await walkAndReplace(docs);

  console.log('Build finished. Output in docs/');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
