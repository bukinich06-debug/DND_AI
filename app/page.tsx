import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Hello World</h1>
      <p>
        <Link href="/api-docs">API Docs (Swagger)</Link>
      </p>
    </main>
  );
}
