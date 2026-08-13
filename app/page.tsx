import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Hello World</h1>
      <p>
        <Link href="/api-docs">API Docs (Swagger)</Link>
      </p>
      <p>
        <Link href="/npc-chat">NPC chat (тест)</Link>
      </p>
    </main>
  );
}
