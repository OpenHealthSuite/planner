import {
  plannerUserRouteGetRequest,
  plannerGetRequest,
  plannerPostRequest,
  plannerUserRoutePostRequest,
  plannerPutRequest,
} from "./apiRequest";

describe("plannerUserRouteGetRequest", () => {
  test("Gets user details and prepends to request path", async () => {
    const authDetails = { userId: "fakeUserId" };
    const fakeAuthDetails = vi.fn().mockResolvedValue(authDetails);
    const response = { whoami: "ReturnedSettings" };
    const fakePlannerGetRequest = vi.fn().mockResolvedValue(response);
    const fakeRequestRoute = "/fakeRequestRoute";

    const result = await plannerUserRouteGetRequest(
      fakeRequestRoute,
      fakeAuthDetails,
      fakePlannerGetRequest
    );

    expect(result).toBe(response);
    expect(fakePlannerGetRequest).toBeCalledWith(
      "/users/" + authDetails.userId + fakeRequestRoute
    );
  });
});

describe("plannerUserRoutePostRequest", () => {
  test("Gets user details and prepends to request path", async () => {
    const authDetails = { userId: "fakeUserId" };
    const fakeAuthDetails = vi.fn().mockResolvedValue(authDetails);
    const response = { whoami: "ReturnedSettings" };
    const fakePlannerPostRequest = vi.fn().mockResolvedValue(response);
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    const result = await plannerUserRoutePostRequest(
      fakeRequestRoute,
      fakeRequestBody,
      fakeAuthDetails,
      fakePlannerPostRequest
    );

    expect(result).toBe(response);
    expect(fakePlannerPostRequest).toBeCalledWith(
      "/users/" + authDetails.userId + fakeRequestRoute,
      fakeRequestBody
    );
  });
});

describe("plannerUserRoutePutRequest", () => {
  test("Gets user details and prepends to request path", async () => {
    const authDetails = { userId: "fakeUserId" };
    const fakeAuthDetails = vi.fn().mockResolvedValue(authDetails);
    const response = { whoami: "ReturnedSettings" };
    const fakePlannerPutRequest = vi.fn().mockResolvedValue(response);
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    const result = await plannerUserRoutePostRequest(
      fakeRequestRoute,
      fakeRequestBody,
      fakeAuthDetails,
      fakePlannerPutRequest
    );

    expect(result).toBe(response);
    expect(fakePlannerPutRequest).toBeCalledWith(
      "/users/" + authDetails.userId + fakeRequestRoute,
      fakeRequestBody
    );
  });
});

describe("plannerGetRequest", () => {
   const { location } = window;

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { reload: vi.fn() };
  });

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    window.location = location;
  });
  test("Happy path :: uses URL, rereives data", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";

    const result = await plannerGetRequest(
      fakeRequestRoute,
      fakeFetch,
      fakeApiRoot
    );

    expect(result).toBe(response);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute);
  });
  test("Non 200 status :: throws error", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 500,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";

    await expect(
      plannerGetRequest(fakeRequestRoute, fakeFetch, fakeApiRoot)
    ).rejects.not.toBeUndefined();
    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute);
    expect(vi.mocked(window.location.reload)).not.toBeCalled();
  });
  test.each([401, 403])("%s status :: refreshes page", async (status) => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";
    
    await expect(
      plannerGetRequest(fakeRequestRoute, fakeFetch, fakeApiRoot)
    ).rejects.not.toBeUndefined();

    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute);

    expect(vi.mocked(window.location.reload)).toBeCalledTimes(1);
  });
});

describe("plannerPostRequest", () => {
     const { location } = window;

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { reload: vi.fn() };
  });

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    window.location = location;
  });
  test("Happy path :: uses URL, uses body, rereives data", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeRequestBody = { whoami: "FakeRequestBody" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";

    const result = await plannerPostRequest(
      fakeRequestRoute,
      fakeRequestBody,
      fakeFetch,
      fakeApiRoot
    );

    expect(result).toBe(response);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
  });
  test("Non 200 status :: throws error", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 500,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    await expect(
      plannerPostRequest(
        fakeRequestRoute,
        fakeRequestBody,
        fakeFetch,
        fakeApiRoot
      )
    ).rejects.not.toBeUndefined();
    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
    expect(vi.mocked(window.location.reload)).not.toBeCalled();
  });

  test.each([401, 403])("%s status :: refreshes page", async (status) => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    await expect(
      plannerPostRequest(
        fakeRequestRoute,
        fakeRequestBody,
        fakeFetch,
        fakeApiRoot
      )
    ).rejects.not.toBeUndefined();
    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
    expect(vi.mocked(window.location.reload)).toBeCalledTimes(1);
  });
});

describe("plannerPutRequest", () => {
     const { location } = window;

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { reload: vi.fn() };
  });

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    window.location = location;
  });
  test("Happy path :: uses URL, uses body, rereives data", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeRequestBody = { whoami: "FakeRequestBody" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";

    const result = await plannerPutRequest(
      fakeRequestRoute,
      fakeRequestBody,
      fakeFetch,
      fakeApiRoot
    );

    expect(result).toBe(response);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
  });
  test("Non 200 status :: throws error", async () => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 500,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    await expect(
      plannerPutRequest(
        fakeRequestRoute,
        fakeRequestBody,
        fakeFetch,
        fakeApiRoot
      )
    ).rejects.not.toBeUndefined();
    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
    expect(vi.mocked(window.location.reload)).not.toBeCalled();
  });
  test.each([401, 403])("%s status :: refreshes page", async (status) => {
    const response = { whoami: "ReturnedSettings" };
    const fakeFetch = vi.fn().mockResolvedValue({
      status,
      json: vi.fn().mockResolvedValue(response),
    });
    const fakeRequestRoute = "/fakeRequestRoute";
    const fakeApiRoot = "http://localhost:9090";
    const fakeRequestBody = { whoami: "FakeRequestBody" };

    await expect(
      plannerPutRequest(
        fakeRequestRoute,
        fakeRequestBody,
        fakeFetch,
        fakeApiRoot
      )
    ).rejects.not.toBeUndefined();
    expect(fakeFetch).toBeCalledTimes(1);
    expect(fakeFetch).toBeCalledWith(fakeApiRoot + fakeRequestRoute, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(fakeRequestBody),
    });
    expect(vi.mocked(window.location.reload)).toBeCalledTimes(1);
  });
});
