const fs = require("fs");
const path = require("path");

function findFiles(dir, ext) {
  let results = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findFiles(fullPath, ext));
      } else if (ext.some((e) => entry.endsWith(e))) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

const root = path.join(process.cwd(), "src");
const files = findFiles(root, [".tsx", ".ts", ".css"]);

let totalReplacements = 0;

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  let newContent = content;

  // 1. text-primary → text-accent-ink (but NOT text-primary-foreground)
  newContent = newContent.replace(
    /text-primary(?!-foreground)/g,
    "text-accent-ink",
  );
  // 2. fill-primary → fill-accent-ink
  newContent = newContent.replace(
    /fill-primary\b/g,
    "fill-accent-ink",
  );
  // 3. border-primary → border-accent-ink
  newContent = newContent.replace(
    /border-primary\b/g,
    "border-accent-ink",
  );

  // 4. bg-primary-soft text-primary → bg-primary-soft text-accent-ink
  newContent = newContent.replace(
    /bg-primary-soft\s+text-primary\b/g,
    "bg-primary-soft text-accent-ink",
  );
  // 5. bg-primary text-primary → bg-primary text-accent-ink
  newContent = newContent.replace(
    /bg-primary\s+text-primary\b/g,
    "bg-primary text-accent-ink",
  );

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    totalReplacements++;
    console.log(`Replaced in ${filePath}`);
  }
}

console.log(`Processed ${files.length} files, ${totalReplacements} replacements total.`);