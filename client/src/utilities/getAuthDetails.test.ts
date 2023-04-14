import { getAuthDetails } from "./getAuthDetails";

describe("AuthenticationDetails function", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });
  test.each(["something", "userelse", "userID"])("Calls /whoami for user details", async (userValue) => {
    const fakePlannerGet = vi.fn().mockResolvedValue({ userId: userValue });
    process.env.REACT_APP_DEV_USER_ID = undefined;
    const result = await getAuthDetails(fakePlannerGet);
    expect(fakePlannerGet).toBeCalledTimes(1);
    expect(fakePlannerGet).toBeCalledWith("/whoami");
    expect(result.userId).toBe(userValue);
  });
});
