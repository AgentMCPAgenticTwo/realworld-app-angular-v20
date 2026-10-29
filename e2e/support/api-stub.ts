import type { Page, Route, Request } from '@playwright/test';

/**
 * The Angular app talks to a Spring/Node "tutorials" API at
 * environment.apiUrl (http://localhost:5001/api) which is NOT running in CI,
 * so every spec stubs it with page.route using the contract response shapes
 * ({ id, title, description, published, createdAt, updatedAt }).
 */

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const API = '**/api/tutorials**';

export function tutorial(over: Partial<Tutorial> = {}): Tutorial {
  return {
    id: 1,
    title: 'Angular Basics',
    description: 'Components, templates and bindings',
    published: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...over,
  };
}

export interface ApiCall {
  method: string;
  url: string;
  body: any;
}

export interface StubOptions {
  /** rows returned by GET /tutorials (and by the ?title= search) */
  list?: Tutorial[];
  /** rows returned by GET /tutorials?title=... ; defaults to `list` */
  searchResult?: Tutorial[];
  /** row returned by GET /tutorials/:id ; null => 404 */
  byId?: Tutorial | null;
  /** force every route to fail with this status */
  failStatus?: number;
  /** delay every response by this many ms (for loading states) */
  delayMs?: number;
}

/**
 * Installs the stub and returns the list of calls the app made, so a test can
 * assert on the request the UI actually sent (method, url, payload).
 */
export async function stubApi(page: Page, options: StubOptions = {}): Promise<ApiCall[]> {
  const calls: ApiCall[] = [];
  const list = options.list ?? [];

  await page.route(API, async (route: Route, request: Request) => {
    const url = new URL(request.url());
    const method = request.method();
    let body: any = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    calls.push({ method, url: request.url(), body });

    if (options.delayMs) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }

    const json = (status: number, payload: unknown) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });

    if (options.failStatus) {
      return json(options.failStatus, { message: 'Some error occurred' });
    }

    const idMatch = /\/api\/tutorials\/(.+)$/.exec(url.pathname);

    if (method === 'GET' && idMatch) {
      const found = options.byId;
      return found ? json(200, found) : json(404, { message: 'Not found' });
    }
    if (method === 'GET') {
      const title = url.searchParams.get('title');
      if (title !== null) {
        const result =
          options.searchResult ??
          list.filter((t) => t.title.toLowerCase().includes(title.toLowerCase()));
        return json(200, result);
      }
      return json(200, list);
    }
    if (method === 'POST') {
      return json(201, { ...tutorial(), ...(body ?? {}), id: 99 });
    }
    if (method === 'PUT') {
      return json(200, { message: 'Tutorial was updated successfully.' });
    }
    if (method === 'DELETE' && idMatch) {
      return json(200, { message: 'Tutorial was deleted successfully!' });
    }
    if (method === 'DELETE') {
      return json(200, { message: 'All tutorials were deleted successfully!' });
    }
    return json(500, { message: 'unexpected request' });
  });

  return calls;
}
