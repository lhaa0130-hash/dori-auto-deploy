// 이 파일은 서버에서만 실행되도록 명시합니다.
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

// Next.js가 어떤 글 주소들이 있는지 미리 알 수 있도록 모든 글의 주소(slug) 목록을 가져옵니다.
export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      slug: fileName.replace(/\.md$/, ''),
    };
  });
}
