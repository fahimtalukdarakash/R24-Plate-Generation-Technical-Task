export const Logger = (() => {
  const isProd =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.MODE === "production";
  const enabled =
    !isProd || (typeof window !== "undefined" && window.__DEBUG__ === true);

  const fmt = (level, msg, ...rest) => {
    const ts = new Date().toISOString();
    return [
      `[%c${level}%c ${ts}] ${msg}`,
      "color:#0ea5e9;font-weight:600",
      "color:inherit",
      ...rest,
    ];
  };

  return {
    info: (msg, ...rest) =>
      enabled && console.info(...fmt("INFO", msg, ...rest)),
    warn: (msg, ...rest) => console.warn(...fmt("WARN", msg, ...rest)),
    error: (msg, ...rest) => console.error(...fmt("ERROR", msg, ...rest)),
  };
})();
