
# exist – SPA (Adaptive Probe, Configurable Timeouts & Windows)

A zero‑dependency, single‑file web app to monitor internet reachability by probing a configurable URL. **exist** adapts its probe frequency within **configurable bounds**, visualizes **latency** (milliseconds) over a rolling window, and reports an **overall status** based on a configurable time window.

---

## ✅ What it does

- **Connectivity probe:** Calls a target URL you set (default: `https://www.yahoo.com/favicon.ico`), using `fetch` with `no-cors` and an explicit timeout.
- **Adaptive cadence (configurable bounds):**
  - **More often on failures** (interval tightens).
  - **Less often on successes** (interval backs off).
  - **Never faster than Min interval** and **never slower than Max interval** (both editable).
- **Timeout policy (editable):** A probe **fails** if it doesn’t complete within **Timeout** (default: 2s).
- **Status window (editable):** Computes **Healthy / Unstable / Down** over the last **X minutes** (default: 5 min).
- **History window (editable):** Retains a rolling **X hours** of results (default: 2 hours) and renders a latency chart.
- **Persistence:** Stores your **Probe URL**, **Min/Max interval**, **Timeout**, **History window**, and **Status window** in the browser’s **localStorage**.

---

## 🚀 Quick Start

1. Open the HTML file (`internet-monitor.html`) in a modern browser (Chrome/Edge/Firefox).
2. Set the **Probe URL**, then click **Apply**.  
   - You can enter a domain (e.g., `bing.com`) or a full link (e.g., `http://www.gstatic.com/generate_204`).
   - Bare domains default to `https://` and `/favicon.ico` if no path is provided.
3. Configure **Min interval** and **Max interval** (seconds), then **Apply limits**.
4. Configure **Timeout (s)**, **History window (hours)**, **Status window (minutes)**, then **Apply settings**.
5. Use **Test now** to trigger a probe (it still honors the **Min interval** guard).
6. Use **Clear history** to wipe the rolling window stored locally.

> For verbose diagnostics, open with:  
> `internet-monitor.html?log=debug&trace=1&net=1`

---

## 🧭 Controls & UI

- **Probe URL**: Target to call. A cache‑buster is added to avoid cached responses.
- **Min/Max interval (seconds)**: Bounds for the adaptive cadence.
- **Timeout (seconds)**: If a probe takes longer than this, it’s counted as **Failure**.
- **History window (hours)**: Rolling window used by the chart and data retention.
- **Status window (minutes)**: Window used to compute the overall status.
- **Status badge**: Shows **Healthy / Unstable / Down** based on the status window.
- **Latency chart**: Plots latency in **ms** over the history window.  
  - **Green** point/segment = latency **below** timeout.  
  - **Red** = at/over timeout (failures or too slow).  
  - **Hover** to see timestamp and duration.
- **Test now / Clear history**: Manual controls (respect guardrails/persistence).

---

## 🔧 Probe Logic (High‑Level)

- Uses **`fetch(url, { mode: 'no-cors' })`** with an **AbortController** timeout:
  - If the request **completes** before the timeout, the result is **Success** (opaque cross‑origin is acceptable for reachability).
  - If the request **aborts** at **Timeout** (or errors), result is **Failure**.
- Works with:
  - **Small public assets** (e.g., `/favicon.ico`).
  - **204 No Content** endpoints (e.g., `http://www.gstatic.com/generate_204`).

---

## ⏱️ Cadence (Adaptive + Guardrails)

- **Initial interval:** Midpoint between **Min** and **Max**.
- **On Failure:** Interval **tightens** (~30% shorter), clamped to **≥ Min**.
- **On Success:** Interval **backs off** (~18% longer + 0.5s), clamped to **≤ Max**.
- **Hard guardrail:** The scheduler prevents any run **faster** than **Min** (applies to auto runs and “Test now”).

---

## 🧮 Status (Configurable Window)

- Evaluates the last **Status window** (default **5 min**):
  - **Healthy:** Success rate ≥ **90%**
  - **Unstable:** 60–89%
  - **Down:** < 60%
- The **last probe** line also shows “Internet is working” vs “Internet is bad” based on the latest result relative to **Timeout**.

---

## 📈 Latency Chart (Rolling History)

- X-axis: Relative time across the **History window** (default **2 hours**).
- Y-axis: **Latency (ms)**. A dashed line marks the **Timeout** threshold.
- **Coloring:** Each point/segment is **green** if latency < Timeout, **red** otherwise.
- **Hover tooltip:** Timestamp & latency for the nearest data point.
- Redraws on window resize.

---

## 💾 Persistence

- **History**: Stored in `localStorage` (rolling by **History window**).
- **Settings**: Stores **Probe URL**, **Min/Max interval**, **Timeout**, **History window**, **Status window**.
- In privacy modes, localStorage may be disabled.

---

## ✅ Recommended URLs

- Public, small assets like **`/favicon.ico`**.
- Captive portal endpoints like **`http://www.gstatic.com/generate_204`** (returns **204 No Content**; handled via `fetch`).

---

## 🧩 Troubleshooting

- **No persistence**: Likely due to privacy mode or enterprise storage policy.
- **Unexpected failures**: Verify the endpoint is public/reachable; try a known CDN asset.
- **“Works in browser but fails here”**: If the endpoint requires credentials or disallows cross-origin requests, it may not resolve in `no-cors`. Prefer public test endpoints.

---

## 🔍 Optional Diagnostics

Append query params:

- `?log=debug` — verbose logs
- `&trace=1` — grouped logs (`runOnce()`, `updateUI()`, `probeOnce()`)
- `&net=1` — times network operations

Example:  
`internet-monitor.html?log=debug&trace=1&net=1`

---

*exist is a local, client‑side tool. Save the HTML and run—no external dependencies.*
``
