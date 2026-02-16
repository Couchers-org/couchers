// eslint-disable-next-line
const fs = require("fs");
// eslint-disable-next-line
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "markdown", "blog");
const OUTPUT_FILE = path.join(__dirname, "..", "markdown", "blog.md");

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return frontmatter;
}

function findMarkdownFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function generateBlogIndex() {
  const files = findMarkdownFiles(BLOG_DIR);

  const posts = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const frontmatter = parseFrontmatter(content);

    // Only include posts with a description (filters out translated variants)
    if (!frontmatter.description) continue;

    // Derive URL from file path: markdown/blog/YYYY/MM/DD/slug.md -> /blog/YYYY/MM/DD/slug
    const relativePath = path.relative(BLOG_DIR, filePath);
    const urlPath = "/blog/" + relativePath.replace(/\.md$/, "");

    posts.push({
      title: frontmatter.title || path.basename(filePath, ".md"),
      date: frontmatter.date || "",
      description: frontmatter.description,
      author: frontmatter.author || "",
      url: urlPath,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));

  // Generate blog.md
  let output = `---
title: Blog
---

**Welcome to the Couchers.org blog**

If you'd like to contribute to the blog, please [sign up](/volunteer) and let us know!
`;

  for (const post of posts) {
    const byline = post.author
      ? `${post.date} by ${post.author}.`
      : `${post.date}.`;

    output += `
## [${post.title}](${post.url})

${byline}

${post.description}

[Read more.](${post.url})
`;
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Generated blog index with ${posts.length} posts.`);
}

module.exports = generateBlogIndex;
