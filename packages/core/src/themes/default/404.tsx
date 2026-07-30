export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-6xl font-extrabold text-neutral-900 mb-4 tracking-tighter">404</h1>
      <p className="text-xl text-neutral-600 font-medium">The page you are looking for doesn't exist.</p>
      <a href="/" className="mt-8 text-blue-600 hover:underline font-medium">
        &larr; Return Home
      </a>
    </div>
  );
}
