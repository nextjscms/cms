export default function Post({ title, content, date }: { title: string, content: string, date: string }) {
  return (
    <article className="card shadow-sm mb-5">
      <div className="card-body p-md-5">
        <header className="mb-4 text-center">
          <h1 className="display-4 fw-bold">{title}</h1>
          <p className="text-muted text-uppercase small tracking-wide">{date}</p>
        </header>
        {/* Using bootstrap typography classes where possible, or just raw HTML since it's from DB */}
        <div 
          className="fs-5 lh-lg" 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
    </article>
  );
}
