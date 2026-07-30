export default function Archive({ title, posts }: { title: string, posts: any[] }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12 border-b border-neutral-100 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">{title}</h1>
      </header>
      
      <div className="space-y-12">
        {posts.map(post => (
          <article key={post.id}>
            <h2 className="text-2xl font-bold mb-2">
              <a href={`/${post.slug}`} className="text-neutral-900 hover:text-blue-600 transition-colors">
                {post.title}
              </a>
            </h2>
            <time className="text-sm font-medium text-neutral-500 uppercase tracking-widest block mb-3">
              {new Date(post.createdAt).toLocaleDateString()}
            </time>
            <p className="text-neutral-600 line-clamp-3">
              {/* Strip HTML tags for excerpt or use an excerpt field */}
              {post.content?.replace(/<[^>]*>?/gm, '')}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
