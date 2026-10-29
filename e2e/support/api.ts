import type { Page, Route, Request } from '@playwright/test';

/**
 * The Angular app talks to a Node/Express backend at `http://localhost:5001/api`
 * (see `src/environments/environment.ts` + `ApiInterceptor`). That backend is NOT
 * running in CI, so every e2e spec stubs it at the HTTP boundary with `page.route`,
 * using the response shapes from the tutorial REST contract:
 *
 *   GET    /api/tutorials            -> Tutorial[]
 *   GET    /api/tutorials?title=foo  -> Tutorial[]
 *   GET    /api/tutorials/:id        -> Tutorial | 404 { message }
 *   POST   /api/tutorials            -> 201 Tutorial
 *   PUT    /api/tutorials/:id        -> 200 { message }
 *   DELETE /api/tutorials/:id        -> 200 { message }
 *   DELETE /api/tutorials            -> 200 { message }
 */
export interface Tutorial {
  id?: number;
  title?: string;
  description?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const API_GLOB = '**/api/tutorials**';

/** The API origin differs from the app origin, so stubbed responses need CORS headers. */
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

export function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  });
}

export const sampleTutorials: Tutorial[] = [
  {
    id: 1,
    title: 'Angular routing basics',
    description: 'How the router resolves a url to a component.',
    published: true,
    createdAt: '2024-01-02T10:00:00.000Z',
    updatedAt: '2024-01-03T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'RxJS operators',
    description: 'map, switchMap and friends.',
    published: false,
    createdAt: '2024-02-02T10:00:00.000Z',
    updatedAt: '2024-02-03T10:00:00.000Z',
  },
  {
    id: 3,
    title: 'Angular forms',
    description: 'Template driven forms with ngModel.',
    published: false,
    createdAt: '2024-03-02T10:00:00.000Z',
    updatedAt: '2024-03-03T10:00:00.000Z',
  },
];

export interface RecordedCall {
  method: string;
  url: string;
  body: any;
}

export interface FakeApi {
  /** Every non-preflight request the app made to the stubbed API, in order. */
  calls: RecordedCall[];
  /** Current server-side collection, so specs can assert persisted state. */
  tutorials: Tutorial[];
}

export interface FakeApiOptions {
  tutorials?: Tutorial[];
  /** Milliseconds to hold every response, to observe loading/empty states. */
  delayMs?: number;
}

/**
 * Installs an in-memory fake of the tutorials API on `page`.
 * Returns a handle whose `calls`/`tutorials` reflect what the app actually did.
 */
export async function stubApi(page: Page, options: FakeApiOptions = {}): Promise<FakeApi> {
  const api: FakeApi = {
    calls: [],
    tutorials: (options.tutorials ?? sampleTutorials).map((t) => ({ ...t })),
  };
  let nextId = Math.max(0, ...api.tutorials.map((t) => t.id ?? 0)) + 1;

  await page.route(API_GLOB, async (route: Route, request: Request) => {
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
    }

    const url = new URL(request.url());
    const body = safeJson(request.postData());
    api.calls.push({ method: request.method(), url: request.url(), body });

    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    const idPart = url.pathname.replace(/^.*\/tutorials\/?/, '');
    const id = idPart ? Number(idPart) : null;

    switch (request.method()) {
      case 'GET': {
        if (id === null) {
          const title = url.searchParams.get('title');
          const list = title
            ? api.tutorials.filter((t) => (t.title ?? '').toLowerCase().includes(title.toLowerCase()))
            : api.tutorials;
          return json(route, 200, list);
        }
        const found = api.tutorials.find((t) => t.id === id);
        return found
          ? json(route, 200, found)
          : json(route, 404, { message: `Cannot find Tutorial with id=${id}.` });
      }
      case 'POST': {
        const created: Tutorial = {
          id: nextId++,
          title: body?.title ?? '',
          description: body?.description ?? '',
          published: false,
          createdAt: '2024-04-01T10:00:00.000Z',
          updatedAt: '2024-04-01T10:00:00.000Z',
        };
        api.tutorials.push(created);
        return json(route, 201, created);
      }
      case 'PUT': {
        const index = api.tutorials.findIndex((t) => t.id === id);
        if (index === -1) {
          return json(route, 404, { message: `Cannot update Tutorial with id=${id}.` });
        }
        api.tutorials[index] = { ...api.tutorials[index], ...body, id };
        return json(route, 200, { message: 'Tutorial was updated successfully.' });
      }
      case 'DELETE': {
        if (id === null) {
          const removed = api.tutorials.length;
          api.tutorials = [];
          return json(route, 200, { message: `${removed} Tutorials were deleted successfully!` });
        }
        api.tutorials = api.tutorials.filter((t) => t.id !== id);
        return json(route, 200, { message: 'Tutorial was deleted successfully!' });
      }
      default:
        return route.fallback();
    }
  });

  return api;
}

/** Makes every call to the tutorials API fail with `status`. */
export async function stubApiFailure(page: Page, status = 500) {
  await page.route(API_GLOB, (route, request) => {
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
    }
    return json(route, status, { message: 'Some error occurred.' });
  });
}

function safeJson(data: string | null) {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
