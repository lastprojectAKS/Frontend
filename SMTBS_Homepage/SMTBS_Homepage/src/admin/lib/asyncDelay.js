// Every admin/services/* function awaits this before resolving — it's the
// one place standing in for "network latency" so pages already handle
// loading states correctly, and swapping in a real fetch() later changes
// nothing about how callers use these functions.
export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
