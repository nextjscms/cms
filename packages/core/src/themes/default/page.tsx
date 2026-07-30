export default function Page({ title, content, date }: { title: string, content: string, date: string }) {
  return (
    <div
      className="prose prose-lg mx-auto text-neutral-800 leading-relaxed max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
