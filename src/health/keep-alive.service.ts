import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

const DEFAULT_INTERVAL_MINUTES = 10;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Evita que Render Free duerma la instancia tras ~15 min sin tráfico: cada
 * KEEP_ALIVE_INTERVAL_MINUTES (10 por defecto) hace GET a su propia URL
 * pública. Tiene que ser la pública y no localhost, porque solo el tráfico
 * que entra por el proxy de Render cuenta como actividad.
 *
 * - Sin KEEP_ALIVE_URL ni RENDER_EXTERNAL_URL (desarrollo local) no hace nada.
 * - KEEP_ALIVE_URL=off lo desactiva (p. ej. al pasar a un plan de pago).
 * - Un fallo de red o un status no-2xx solo deja un warn: nunca tumba la app.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer?: NodeJS.Timeout;

  onModuleInit(): void {
    const url = this.resolveUrl();
    if (!url) return;

    const intervalMs = this.resolveIntervalMinutes() * 60_000;
    this.logger.log(`Pinging ${url} every ${intervalMs / 60_000} min`);

    this.timer = setInterval(() => void this.ping(url), intervalMs);
    // No debe mantener vivo el proceso si todo lo demás ya terminó.
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private resolveUrl(): string | undefined {
    const override = process.env.KEEP_ALIVE_URL?.trim();
    if (override?.toLowerCase() === 'off') return undefined;

    const base = override || process.env.RENDER_EXTERNAL_URL?.trim();
    if (!base) return undefined;

    return `${base.replace(/\/+$/, '')}/health`;
  }

  private resolveIntervalMinutes(): number {
    const minutes = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES);
    return Number.isFinite(minutes) && minutes > 0
      ? minutes
      : DEFAULT_INTERVAL_MINUTES;
  }

  private async ping(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'nike-store-api-keep-alive' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          `Keep-alive ping to ${url} returned ${response.status}`,
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Keep-alive ping to ${url} failed: ${reason}`);
    }
  }
}
