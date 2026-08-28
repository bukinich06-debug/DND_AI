export const STUB_UNKNOWN = 'неизвестно';

export const isStubText = (value: string) => value.trim().toLowerCase() === STUB_UNKNOWN;
