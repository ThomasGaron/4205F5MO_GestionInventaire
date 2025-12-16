export function buildAuthedFetch(token, backend = import.meta.env.VITE_BACKEND_URI) {
  return (path, init = {}) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    };
    return fetch(`${backend}${path}`, { ...init, headers });
  };
}

export function buildFetchJson(token, backend) {
  const authed = buildAuthedFetch(token, backend);
  return async (path, init) => {
    const res = await authed(path, init);
    return res.json();
  };
}
