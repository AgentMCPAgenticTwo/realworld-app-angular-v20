import type { Page, Route, Request } from '@playwright/test';

/**
 * The Angular app talks to `environment.apiUrl` (http://localhost:5001/api), which is
 * NOT running in CI. Every spec therefore stubs the backend with `page.route`, using the
 * response shapes the real API contract returns (see src/app/models/tutorial.model.ts and
 * src/app/services/tutorial.service.ts).
 */
export interface Tutorial {
  id?: number;
  title?: string;
  description?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 1,
    title: 'Angular signals',
    description: 'Reactive primitives in Angular',
    published: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'RxJS operators',
    description: 'map, switchMap and friends',
    published: false,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-02T00:00:00.000Z',
  },
];

export interface ApiCall {
  method: string;
  url: string;
  body: unknown;
}

export interface StubOptions {
  /** collection returned by GET /tutorials (and by the ?title= search) */
  list?: Tutorial[];
  /** single tutorial returned by GET /tutorials/:id; null → 404 */
  detail?: Tutorial | null;
  /** status code for GET /tutorials, to exercise the error state */
  listStatus?: number;
  /** status code for POST/PUT/DELETE, to exercise failed mutations */
  writeStatus?: number;
}

/**
 * Installs the backend stub and returns the list of calls the app made, so specs can
 * assert on the request the UI actually sent (url, method, payload).
 */
export async function stubApi(page: Page, options: StubOptions = {}): Promise<ApiCall[]> {
  const {
    list = TUTORIALS,
    detail,
    listStatus = 200,
    writeStatus = 200,
  } = options;

  const calls: ApiCall[] = [];
  let nextId = 100;

  await page.route('**/api/tutorials**', async (route: Route, request: Request) => {
    const method = request.method();
    const url = new URL(request.url());
    const idMatch = /\/api\/tutorials\/([^/?]+)$/.exec(url.pathname);
    let body: unknown = null;
    try {
      body = request.postData() ? JSON.parse(request.postData() as string) : null;
    } catch {
      body = request.postData();
    }
    calls.push({ method, url: request.url(), body });

    const json = (status: number, payload: unknown) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });

    if (method === 'GET' && idMatch) {
      const requested = detail === undefined
        ? list.find((t) => String(t.id) === idMatch[1]) ?? null
        : detail;
      return requested
        ? json(200, requested)
        : json(404, { message: `Cannot find Tutorial with id=${idMatch[1]}` });
    }

    if (method === 'GET') {
      if (listStatus !== 200) {
        return json(listStatus, { message: 'Some error occurred while retrieving tutorials.' });
      }
      const title = url.searchParams.get('title');
      const filtered = title
        ? list.filter((t) => (t.title ?? '').toLowerCase().includes(title.toLowerCase()))
        : list;
      return json(200, filtered);
    }

    if (method === 'POST') {
      if (writeStatus !== 200) return json(writeStatus, { message: 'Content can not be empty!' });
      const created = { id: nextId++, published: false, ...(body as object) };
      return json(200, created);
    }

    if (method === 'PUT') {
      if (writeStatus !== 200) return json(writeStatus, { message: 'Error updating Tutorial' });
      return json(200, { message: 'Tutorial was updated successfully.' });
    }

    if (method === 'DELETE') {
      if (writeStatus !== 200) return json(writeStatus, { message: 'Could not delete Tutorial' });
      return json(200, idMatch
        ? { message: 'Tutorial was deleted successfully!' }
        : { message: 'All tutorials were deleted successfully!' });
    }

    return json(405, { message: `Unsupported method ${method}` });
  });

  return calls;
}
