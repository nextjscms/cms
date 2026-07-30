export default function Archive({ title, posts }: { title: string, posts: any[] }) {
  return (
    <div>
      <header className="mb-5 border-bottom pb-3">
        <h1 className="display-5 fw-bold">{title}</h1>
      </header>
      
      <div className="row g-4">
        {posts.map(post => (
          <div className="col-md-6 col-lg-4" key={post.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h4 card-title">
                  <a href={`/${post.slug}`} className="text-decoration-none text-dark">
                    {post.title}
                  </a>
                </h2>
                <h6 className="card-subtitle mb-3 text-muted small text-uppercase">
                  {new Date(post.createdAt).toLocaleDateString()}
                </h6>
                <p className="card-text">
                  {/* Strip HTML tags for excerpt */}
                  {post.content?.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                </p>
                <a href={`/${post.slug}`} className="btn btn-outline-primary btn-sm">Read More</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
