import Fastify from 'fastify';
import { scrape, ScrapeError } from './scraper.js';

const fastify = Fastify({
  logger: true,
  // Scraping can take minutes; keep the connection open.
  requestTimeout: 0,
});

interface ScrapeBody {
  url?: string;
  proxy?: string;
  crawlbaseToken?: string;
}

fastify.get('/health', async () => ({ status: 'ok' }));

fastify.post<{ Body: ScrapeBody }>('/scrape', async (request, reply) => {
  const { url, proxy, crawlbaseToken } = request.body ?? {};

  if (!url || typeof url !== 'string') {
    return reply.status(400).send({ error: 'unavailable', message: 'url is required' });
  }

  try {
    const result = await scrape({ url, proxy, crawlbaseToken });
    return reply.send(result);
  } catch (err) {
    if (err instanceof ScrapeError) {
      // 422 for classified, recoverable problems the user should see.
      const status = err.code === 'unavailable' ? 502 : 422;
      request.log.warn({ code: err.code, msg: err.message }, 'scrape failed');
      return reply.status(status).send({ error: err.code, message: err.message });
    }
    request.log.error(err);
    return reply
      .status(502)
      .send({ error: 'unavailable', message: (err as Error)?.message ?? 'scrape failed' });
  }
});

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

fastify
  .listen({ port, host })
  .then(() => fastify.log.info(`scraper listening on ${host}:${port}`))
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
