#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.resolve(__dirname, "../src/content/posts");
const imgDir = path.resolve(__dirname, "../public/img");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function findMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMdFiles(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

function getUsedCovers() {
  const used = new Set();
  for (const file of findMdFiles(postsDir)) {
    const content = fs.readFileSync(file, "utf-8");
    const match = content.match(/coverImage:\s*(.+)/);
    if (match) {
      let val = match[1].trim().replace(/^["']|["']$/g, "");
      used.add(val);
    }
  }
  return used;
}

const systemImages = [
  "avatar", "favicon", "background", "default",
  "loading", "qq", "wechat", "fluid", "police_beian",
];

function isSystemImage(name) {
  return systemImages.some((s) => name.startsWith(s));
}

function pickUnusedImage(used) {
  const exts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const all = fs.readdirSync(imgDir).filter(
    (f) => exts.includes(path.extname(f).toLowerCase()) && !isSystemImage(f)
  );
  const unused = all.filter((f) => !used.has(`/img/${f}`));
  if (unused.length === 0) {
    console.log("⚠️  图片库中无未使用的封面图，跳过封面设置");
    return null;
  }
  const picked = unused[Math.floor(Math.random() * unused.length)];
  return { src: path.join(imgDir, picked), name: picked, ext: path.extname(picked) };
}

function createPost(title, slug, coverRelPath, tags, category) {
  const now = new Date();
  const iso = now.toISOString().replace(/\.\d{3}Z$/, ".000Z");
  const tagStr = tags && tags.length ? `\ntags: [${tags.map((t) => `"${t}"`).join(", ")}]` : "\ntags: []";
  const catStr = category ? `\ncategory: ${category}` : "\ncategory: ";
  const coverStr = coverRelPath ? `\ncoverImage: "${coverRelPath}"` : "";

  const fm = [
    "---",
    `title: ${title}`,
    `pubDate: ${iso}`,
    tagStr,
    catStr,
    coverStr,
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n");

  const postDir = path.join(postsDir, slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, "index.md"), fm, "utf-8");
  return postDir;
}

async function main() {
  const title = await ask("文章标题: ");
  if (!title) {
    console.log("❌ 标题不能为空");
    rl.close();
    return;
  }

  const cat = await ask("分类 (留空跳过): ") || "";
  const tagsRaw = await ask("标签 (逗号分隔, 留空跳过): ") || "";
  const tags = tagsRaw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const slug = title.replace(/[\\/:*?"<>|]/g, "").trim();
  const used = getUsedCovers();
  const img = pickUnusedImage(used);

  let coverRelPath = null;
  if (img) {
    const newName = slug + img.ext;
    const dest = path.join(imgDir, newName);
    fs.copyFileSync(img.src, dest);
    coverRelPath = `/img/${newName}`;
    console.log(`📷 封面图: ${img.name} → ${newName}`);
  } else {
    console.log("📷 未设置封面图");
  }

  const postDir = createPost(title, slug, coverRelPath, tags, cat);
  console.log(`✅ 文章已创建: ${postDir}${path.sep}index.md`);
  console.log(`🌐 预览: http://localhost:4321/posts/${encodeURI(slug)}/`);

  rl.close();
}

main();
