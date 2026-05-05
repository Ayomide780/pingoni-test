const https = require("https");

const SENSITIVE = ["authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token", "proxy-authorization"];

function sendLog(apiKey, payload) {
  const data = JSON.stringify(payload);
  const options = {
    hostname: "apiwatch-production-3f19.up.railway.app",
    port: 443,
    path: "/ingest",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      "x-api-key": apiKey,
    },
  };
  const req2 = https.request(options, () => {});
  req2.on("error", () => {});
  req2.write(data);
  req2.end();
}

function buildSafeHeaders(headers) {
  const safe = {};
  try {
    for (const [key, value] of Object.entries(headers || {})) {
      const lower = key.toLowerCase();
      if (SENSITIVE.includes(lower)) {
        safe[key] = "[REDACTED]";
      } else {
        const v = Array.isArray(value) ? value.join(", ") : String(value);
        safe[key] = v.length > 500 ? v.slice(0, 500) + "..." : v;
      }
    }
  } catch (e) {}
  return safe;
}

function pingoni(apiKey) {
  if (!apiKey) {
    console.warn("[Pingoni] No API key provided. Monitoring disabled.");
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      // Skip if error handler already logged this request
      if (req._pingoniLogged) return;

      const duration = Date.now() - start;
      let errorMessage = null;
      if (res.statusCode >= 500) errorMessage = `Server error (${res.statusCode})`;
      else if (res.statusCode >= 400) errorMessage = `Client error (${res.statusCode})`;

      sendLog(apiKey, {
        method: req.method,
        endpoint: req.originalUrl,
        status_code: res.statusCode,
        response_time: duration,
        error_message: errorMessage,
        headers: buildSafeHeaders(req.headers),
        stack_trace: null,
      });
    });

    req._pingoniStart = start;
    next();
  };
}

// Error handler middleware - captures real stack traces
pingoni.errorHandler = function(apiKey) {
  if (!apiKey) return (err, req, res, next) => next(err);

  return (err, req, res, next) => {
    const duration = Date.now() - (req._pingoniStart || Date.now());
    req._pingoniLogged = true;

    sendLog(apiKey, {
      method: req.method,
      endpoint: req.originalUrl,
      status_code: err.status || 500,
      response_time: duration,
      error_message: err.message || String(err),
      headers: buildSafeHeaders(req.headers),
      stack_trace: err.stack || null,
    });

    next(err);
  };
}

module.exports = pingoni;
