export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export async function studyApi(token: string, path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${API}/api/study${path}`, { method, signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not save this change. Please check your input and try again.");
  return data;
}
export type Subject = { id: string; name: string };
