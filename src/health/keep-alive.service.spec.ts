import { KeepAliveService } from './keep-alive.service';

const ENV_KEYS = [
  'KEEP_ALIVE_URL',
  'KEEP_ALIVE_INTERVAL_MINUTES',
  'RENDER_EXTERNAL_URL',
] as const;

describe('KeepAliveService', () => {
  let service: KeepAliveService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};

  const okResponse = () => ({ ok: true, status: 200 }) as Response;

  beforeEach(() => {
    jest.useFakeTimers();
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    service = new KeepAliveService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    fetchMock.mockRestore();
    jest.useRealTimers();
  });

  it('no hace nada sin URL (desarrollo local)', () => {
    service.onModuleInit();
    jest.advanceTimersByTime(60 * 60_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL desde RENDER_EXTERNAL_URL y quita la barra final', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com/';
    service.onModuleInit();
    jest.advanceTimersByTime(10 * 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.onrender.com/health');
  });

  it('KEEP_ALIVE_URL sobrescribe a RENDER_EXTERNAL_URL', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    process.env.KEEP_ALIVE_URL = 'https://otra.example.com';
    service.onModuleInit();
    jest.advanceTimersByTime(10 * 60_000);

    expect(fetchMock.mock.calls[0][0]).toBe('https://otra.example.com/health');
  });

  it('KEEP_ALIVE_URL=off lo desactiva aunque exista RENDER_EXTERNAL_URL', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    process.env.KEEP_ALIVE_URL = 'off';
    service.onModuleInit();
    jest.advanceTimersByTime(60 * 60_000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hace ping en cada intervalo y para al apagar la app', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    service.onModuleInit();

    jest.advanceTimersByTime(10 * 60_000);
    jest.advanceTimersByTime(10 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    service.onModuleDestroy();
    jest.advanceTimersByTime(60 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('respeta KEEP_ALIVE_INTERVAL_MINUTES', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    process.env.KEEP_ALIVE_INTERVAL_MINUTES = '5';
    service.onModuleInit();

    jest.advanceTimersByTime(5 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('usa 10 min si el intervalo configurado no es válido', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    process.env.KEEP_ALIVE_INTERVAL_MINUTES = 'abc';
    service.onModuleInit();

    jest.advanceTimersByTime(9 * 60_000);
    expect(fetchMock).not.toHaveBeenCalled();
    jest.advanceTimersByTime(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('un fallo de red no lanza', async () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    service.onModuleInit();

    await expect(
      jest.advanceTimersByTimeAsync(10 * 60_000),
    ).resolves.not.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('un 429 no lanza', async () => {
    process.env.RENDER_EXTERNAL_URL = 'https://api.onrender.com';
    fetchMock.mockResolvedValue({ ok: false, status: 429 } as Response);
    service.onModuleInit();

    await expect(
      jest.advanceTimersByTimeAsync(10 * 60_000),
    ).resolves.not.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
