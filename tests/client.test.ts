import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("planfixRequest", () => {
  const origApiKey = process.env.PLANFIX_API_KEY;
  const origToken = process.env.PLANFIX_TOKEN;
  const origAccount = process.env.PLANFIX_ACCOUNT;
  const origDomain = process.env.PLANFIX_DOMAIN;
  const origBaseUrl = process.env.PLANFIX_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.PLANFIX_API_KEY = "test-api-key";
    process.env.PLANFIX_ACCOUNT = "testaccount";
    delete process.env.PLANFIX_TOKEN;
    delete process.env.PLANFIX_DOMAIN;
    delete process.env.PLANFIX_BASE_URL;
  });

  afterEach(() => {
    if (origApiKey !== undefined) process.env.PLANFIX_API_KEY = origApiKey; else delete process.env.PLANFIX_API_KEY;
    if (origToken !== undefined) process.env.PLANFIX_TOKEN = origToken; else delete process.env.PLANFIX_TOKEN;
    if (origAccount !== undefined) process.env.PLANFIX_ACCOUNT = origAccount; else delete process.env.PLANFIX_ACCOUNT;
    if (origDomain !== undefined) process.env.PLANFIX_DOMAIN = origDomain; else delete process.env.PLANFIX_DOMAIN;
    if (origBaseUrl !== undefined) process.env.PLANFIX_BASE_URL = origBaseUrl; else delete process.env.PLANFIX_BASE_URL;
    vi.restoreAllMocks();
  });

  it("throws when no auth env is set", async () => {
    delete process.env.PLANFIX_API_KEY;
    delete process.env.PLANFIX_TOKEN;

    const { planfixRequest } = await import("../src/client.js");
    await expect(planfixRequest("GET", "task/1")).rejects.toThrow("Не задан ключ авторизации");
  });

  it("uses PLANFIX_ACCOUNT for base URL", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1 }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("GET", "task/1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("testaccount.planfix.com/rest/task/1"),
      expect.any(Object),
    );
  });

  it("uses PLANFIX_DOMAIN when set", async () => {
    process.env.PLANFIX_DOMAIN = "planfix.ru";
    const mockResponse = new Response(JSON.stringify({ id: 1 }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("GET", "task/1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("testaccount.planfix.ru/rest/task/1"),
      expect.any(Object),
    );
  });

  it("uses PLANFIX_BASE_URL when set", async () => {
    process.env.PLANFIX_BASE_URL = "https://example.test/rest/";
    const mockResponse = new Response(JSON.stringify({ id: 1 }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("GET", "/task/1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://example.test/rest/task/1"),
      expect.any(Object),
    );
  });

  it("preserves trailing slash in endpoints that require it", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1 }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("POST", "task/5/comments/", { description: "Hello" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("testaccount.planfix.com/rest/task/5/comments/"),
      expect.any(Object),
    );
  });

  it("sends Authorization header with Bearer token", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("POST", "task/list", { offset: 0 });

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].headers.Authorization).toBe("Bearer test-api-key");
    expect(callArgs[1].method).toBe("POST");
  });

  it("falls back to PLANFIX_TOKEN if PLANFIX_API_KEY not set", async () => {
    delete process.env.PLANFIX_API_KEY;
    process.env.PLANFIX_TOKEN = "legacy-token";

    const mockResponse = new Response(JSON.stringify({}), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await planfixRequest("GET", "task/1");

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].headers.Authorization).toBe("Bearer legacy-token");
  });

  it("throws on non-retryable HTTP errors", async () => {
    const mockResponse = new Response("Forbidden", { status: 403, statusText: "Forbidden" });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { planfixRequest } = await import("../src/client.js");
    await expect(planfixRequest("GET", "task/1")).rejects.toThrow("Planfix HTTP 403");
  });
});
