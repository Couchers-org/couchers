// eslint-disable-next-line
const fs = require("fs");
// eslint-disable-next-line
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "markdown", "blog");
const OUTPUT_FILE = path.join(__dirname, "..", "markdown", "blog.md");
const RSS_FILE = path.join(__dirname, "..", "public", "blog", "rss.xml");

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://couchers.org";
}

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

**Welcome to the Couchers.org blog** &mdash; <a href="/blog/rss.xml"><img src="/img/blog/rss_icon.svg" alt="RSS" style="width: 14px; vertical-align: middle;" /></a> [RSS feed](/blog/rss.xml)

If you'd like to contribute to the blog, please [sign up](/volunteer) and let us know!
`;

  for (const post of posts) {
    const byline = post.author ? `${post.date} by ${post.author}.` : `${post.date}.`;

    output += `
<div class="blog-entry">

## [${post.title}](${post.url})

<p class="blog-entry-date">${byline}</p>

${post.description}

[Read more.](${post.url})

</div>
`;
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Generated blog index with ${posts.length} posts.`);

  // Generate RSS feed
  const rssItems = posts
    .map((post) => {
      const dateStr = post.date.replace(/\//g, "-");
      const pubDate = new Date(dateStr).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${getSiteUrl()}${post.url}</link>
      <guid>${getSiteUrl()}${post.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description)}</description>${post.author ? `\n      <author>${escapeXml(post.author)}</author>` : ""}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Couchers.org Blog</title>
    <link>${getSiteUrl()}/blog</link>
    <description>News and updates from Couchers.org, the non-profit couch surfing platform.</description>
    <language>en</language>
    <atom:link href="${getSiteUrl()}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`;

  fs.mkdirSync(path.dirname(RSS_FILE), { recursive: true });
  fs.writeFileSync(RSS_FILE, rss);
  console.log(`Generated RSS feed with ${posts.length} posts.`);
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = generateBlogIndex;
