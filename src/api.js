function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

export async function ensureCsrfCookie() {
  const response = await fetch("/api/auth/csrf/", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not initialize the secure request token.");
  }
}

export async function apiRequest(path, options = {}) {
  const method = options.method ?? "GET";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfCookie();
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    method,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRFToken": getCookie("csrftoken") } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : {};
  if (!response.ok) {
    const error = new Error(
      data.detail || `Request failed with HTTP ${response.status}.`,
    );
    error.status = response.status;
    throw error;
  }
  if (!contentType.includes("application/json")) {
    throw new Error("The Django API is unavailable. Start the backend and restart Vite.");
  }
  return data;
}
