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
      <p>
        <Link href="/location-look">Location look (тест)</Link>
      </p>
      <p>
        <Link href="/plan">Планировщик (тест)</Link>
      </p>
      <p>
        <Link href="/master">Мастер (тест)</Link>
      </p>
    </main>
  );
}
