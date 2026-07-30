export default function Post({ title, content, date }: { title: string, content: string, date: string }) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900 mb-6">{title}</h1>
        <time className="text-sm font-medium text-neutral-500 uppercase tracking-widest">{date}</time>
      </header>
      <div
        className="prose prose-lg mx-auto text-neutral-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
