export function unwrapBackendData(value: unknown): unknown {
  let current = value;

  // Generated clients and older test fixtures may expose the Axios/Kubb
  // response as a plain { data } transport wrapper.
  if (current && typeof current === "object" && "data" in current) {
    current = (current as { data: unknown }).data;
  }

  // Most controllers rely on the global TransformInterceptor and therefore
  // return one { success, data } envelope. A few legacy controllers still
  // return that shape themselves, which the interceptor wraps a second time.
  // Peel only confirmed backend envelopes so domain objects with a `data`
  // property are left intact.
  while (
    current &&
    typeof current === "object" &&
    "success" in current &&
    (current as { success?: unknown }).success === true &&
    "data" in current
  ) {
    current = (current as { data: unknown }).data;
  }

  return current;
}
