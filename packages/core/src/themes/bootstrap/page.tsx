export default function Page({ title, content }: { title: string, content: string, date: string }) {
  return (
    <article>
      {/* Example of a custom CSS class defined in theme.css */}
      <div className="custom-jumbotron text-center">
        <h1 className="display-3 fw-bold">{title}</h1>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <div 
            className="fs-5 lh-lg" 
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      </div>
    </article>
  );
}
