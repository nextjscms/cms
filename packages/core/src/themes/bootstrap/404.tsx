export default function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <p className="lead">The page you are looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary mt-3">
        &larr; Return Home
      </a>
    </div>
  );
}
