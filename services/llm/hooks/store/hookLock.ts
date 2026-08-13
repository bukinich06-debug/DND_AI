const HOOK_TIMEOUT_MS = 90_000;

interface IHookEntry {
  promise: Promise<void>;
}

const locks = new Map<string, IHookEntry>();

export const waitForHooks = async (chatKey: string) => {
  const entry = locks.get(chatKey);
  if (!entry) return;

  let timedOut = false;
  await Promise.race([
    entry.promise,
    new Promise<void>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve();
      }, HOOK_TIMEOUT_MS);
    }),
  ]);

  if (timedOut) {
    locks.delete(chatKey);
    console.error(`[hooks] timeout chatKey=${chatKey}`);
  }
};

export const startHooks = (chatKey: string, run: () => Promise<void>) => {
  const previous = locks.get(chatKey)?.promise ?? Promise.resolve();
  const promise = previous
    .catch(() => undefined)
    .then(run)
    .catch((e) => {
      console.error(`[hooks] failed chatKey=${chatKey}`, e);
    })
    .finally(() => {
      const current = locks.get(chatKey);
      if (current?.promise === promise) locks.delete(chatKey);
    });

  locks.set(chatKey, { promise });
};
