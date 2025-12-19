const fs = require('fs').promises;
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const docsDir = path.join(repoRoot, 'docs');

async function rimraf(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function findFiles(dir, exts) {
  const result = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (exts.includes(path.extname(e.name))) result.push(p);
    }
  }
  await walk(dir);
  return result;
}

async function replaceInFile(filePath, replacements) {
  let content = await fs.readFile(filePath, 'utf8');
  let changed = false;
  for (const {regex, repl} of replacements) {
    const newContent = content.replace(regex, repl);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  if (changed) {
    await fs.writeFile(filePath, content, 'utf8');
  }
}

async function build() {
  console.log('Preparing docs/ folder...');
  await rimraf(docsDir);
  await fs.mkdir(docsDir, { recursive: true });

  // copy html
  const srcHtml = path.join(srcDir, 'html');
  // copy index.html to docs root
  await fs.copyFile(path.join(srcHtml, 'index.html'), path.join(docsDir, 'index.html'));
  // copy pages folder
  const srcPages = path.join(srcHtml, 'pages');
  const destPages = path.join(docsDir, 'pages');
  await copyDir(srcPages, destPages);

  // copy assets
  const assets = ['css', 'js', 'images'];
  for (const a of assets) {
    const s = path.join(srcDir, a);
    const d = path.join(docsDir, a);
    await copyDir(s, d);
  }

  console.log('Adjusting paths in HTML/CSS/JS...');

  // Replacements for files in docs root (docs/*.html)
  const rootHtmlFiles = (await fs.readdir(docsDir)).filter(f => f.endsWith('.html')).map(f => path.join(docsDir, f));
  for (const file of rootHtmlFiles) {
    await replaceInFile(file, [
      { regex: /\.\.\/\.\.\/(css|js|images)\//g, repl: '$1/' },
      { regex: /\.\.\/(css|js|images)\//g, repl: '$1/' },
      { regex: /\.\.\/html\/pages\//g, repl: 'pages/' }
    ]);
  }

  // Replacements for files in docs/pages (they need one-level-up relative paths)
  const pageHtmlFiles = await findFiles(destPages, ['.html']);
  for (const file of pageHtmlFiles) {
    await replaceInFile(file, [
      { regex: /\.\.\/\.\.\/(css|js|images)\//g, repl: '../$1/' },
      { regex: /\.\.\/(css|js|images)\//g, repl: '../$1/' },
      { regex: /\.\.\/html\/pages\//g, repl: '' }
    ]);
  }

  // JS files: normalize double-up image paths to one-up
  const jsFiles = await findFiles(path.join(docsDir, 'js'), ['.js']);
  for (const file of jsFiles) {
    await replaceInFile(file, [
      { regex: /\.\.\/\.\.\/images\//g, repl: '../images/' },
      { regex: /\.\.\/\.\.\/css\//g, repl: '../css/' },
      { regex: /\.\.\/\.\.\/js\//g, repl: '../js/' }
    ]);
  }

  // CSS files: if any use '../../images/' (from deeper structure), collapse to correct relative path from css folder
  const cssFiles = await findFiles(path.join(docsDir, 'css'), ['.css']);
  for (const file of cssFiles) {
    await replaceInFile(file, [
      { regex: /\.\.\/\.\.\/images\//g, repl: '../images/' }
    ]);
  }

  console.log('Docs build completed.');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
