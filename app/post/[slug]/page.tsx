import { getPostContent, getAllPostSlugs } from '@/lib/getPostContent';
import { marked } from 'marked'; // ⭐️ 이 부분의 오타나 경로 누락이 흔한 원인입니다.
import Link from 'next/link';

// Next.js에게 "어떤 주소들이 있는지 미리 알려주는" 함수입니다.
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug: slug.slug,
  }));
}

// 글 상세 페이지를 만드는 함수입니다.
export default function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // (1) 글의 내용을 가져옵니다.
  const post = getPostContent(slug);

  // (2) Markdown으로 된 본문 내용을 HTML로 변환합니다.
  const contentHtml = marked(post.content);

  return (
    <main style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.9em' }}>
        &larr; 글 목록으로 돌아가기
      </Link>
      
      <article>
        <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>{post.title}</h1>
        <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '30px' }}>게시일: {post.date}</p>
        
        {/* (3) 변환된 HTML 내용을 안전하게 웹사이트에 출력합니다. */}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>
    </main>
  );
}
