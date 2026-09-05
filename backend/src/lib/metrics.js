const metrics = {
  callSetupTimeMs: [],
  callSetupSuccessTotal: 0,
  callSetupFailureTotal: 0,
  reconnectAttemptTotal: 0,
  reconnectSuccessTotal: 0,
};

export const recordCallSetupTime = (durationMs) => {
  metrics.callSetupTimeMs.push(durationMs);
  if (metrics.callSetupTimeMs.length > 200) {
    metrics.callSetupTimeMs.shift();
  }
};

export const recordCallSetupSuccess = (durationMs) => {
  metrics.callSetupSuccessTotal += 1;
  recordCallSetupTime(durationMs);
};

export const recordCallSetupFailure = () => {
  metrics.callSetupFailureTotal += 1;
};

export const recordReconnectAttempt = () => {
  metrics.reconnectAttemptTotal += 1;
};

export const recordReconnectSuccess = () => {
  metrics.reconnectSuccessTotal += 1;
};

export const getMetricsSnapshot = () => {
  const values = metrics.callSetupTimeMs;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  return {
    call_setup_time_ms: {
      samples: values.length,
      median_ms: median,
      p95_ms: sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] : 0,
    },
    call_setup_success_total: metrics.callSetupSuccessTotal,
    call_setup_failure_total: metrics.callSetupFailureTotal,
    reconnect_attempt_total: metrics.reconnectAttemptTotal,
    reconnect_success_total: metrics.reconnectSuccessTotal,
  };
};
