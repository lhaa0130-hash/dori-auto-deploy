import 'server-only'; 
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content');

export function getPostContent(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Combine the data with the slug and content
  return {
    slug,
    title: matterResult.data.title as string,
    date: matterResult.data.date as string,
    content: matterResult.content, // 글 본문 내용
  };
}
