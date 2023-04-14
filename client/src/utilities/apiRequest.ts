const API_ROOT = "/api";

export async function plannerGetRequest<T>(
  path: string,
  fnFetch = fetch,
  apiRoot = API_ROOT
): Promise<T> {
  const response = await fnFetch(apiRoot + path);
  if (response.status === 200) {
    return (await response.json()) as T;
  } else {
    if ([401, 403].includes(response.status)) {
      window.location.reload();
    }
    throw new Error(`HTTP Status ${response.status}: Error retrieving data`);
  }
}

export async function plannerPostRequest<R, T>(
  path: string,
  body: R,
  fnFetch = fetch,
  apiRoot = API_ROOT
): Promise<T> {
  const response = await fnFetch(apiRoot + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
  });
  if (response.status === 200) {
    return (await response.json()) as T;
  } else {
    if ([401, 403].includes(response.status)) {
      window.location.reload();
    }
    throw new Error(`HTTP Status ${response.status}: Error retrieving data`);
  }
}

export async function plannerPutRequest<R, T>(
  path: string,
  body: R,
  fnFetch = fetch,
  apiRoot = API_ROOT
): Promise<T> {
  const response = await fnFetch(apiRoot + path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
  });
  if (response.status === 200) {
    return (await response.json()) as T;
  } else {
    if ([401, 403].includes(response.status)) {
      window.location.reload();
    }
    throw new Error(`HTTP Status ${response.status}: Error retrieving data`);
  }
}
