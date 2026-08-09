import { NextResponse } from 'next/server';

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export const noContent = () => new NextResponse(null, { status: 204 });

export const toErrorResponse = (e: unknown) => {
  if (!(e instanceof Error)) return NextResponse.json({ error: 'Внутренняя ошибка сервера.' }, { status: 500 });

  const message = e.message;
  const isNotFound = /не найден[аоы]?/i.test(message);
  return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 400 });
};
