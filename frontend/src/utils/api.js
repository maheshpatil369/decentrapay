const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const api = {
  get: (path, token) =>
    fetch(`${BASE}${path}`, { headers: headers(token) }).then(r => r.json()),

  post: (path, body, token) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    }).then(r => r.json()),
};
