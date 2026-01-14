
# exist – SPA (Adaptive Probe, Configurable Timeouts & Window)

A zero‑dependency, single‑file web app to monitor internet reachability by probing a configurable URL. **exist** adapts its probe frequency within **configurable bounds**, visualizes **latency** (milliseconds) over a rolling window, and reports an **overall status** based on a configurable time window.

---

## ✅ What it does

- **Connectivity probe:** Calls a target URL you set (default: `https://www.yahoo.com/favicon.ico`), using `fetch` with `no-cors` and an explicit timeout.
- **Adaptive cadence (configurable bounds):**
  - **More often on failures** (interval tightens).
  - **Less often on successes** (interval backs off).
  - **Never faster than Min interval** and **never slower than Max interval** (both editable).
- **Timeout policy (editable):** A probe **fails** if it doesn’t complete within **Timeout**.
- **Status window (editable):** Computes **Healthy / Unstable / Down** over the last **X minutes**.
- **History window (editable):** Retains a rolling **X hours** of results and renders a latency chart.
- **Persistence:** Stores your **Probe URL**, **Min/Max interval**, **Timeout**, **History window**, and **Status window** in the browser’s **localStorage**.

---

## 🖼️ Screenshots


### Settings modal (desktop)
<!-- Replace {{IMG1_BASE64}} with the actual base64 of your PNG -->

  <img alt="exist — Settings modal" src="/1.png" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);" />

  <img alt="exist — Main dashboard desktop" src="/2.png" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);" />


  <img alt="exist — Main dashboard mobile" src="/3.png" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);" />


## 🚀 Quick Start

1. Open the HTML page in a modern browser (Chrome/Edge/Firefox).
2. Click **Settings**:
   - Set the **Probe URL**, **Min/Max interval (seconds)**, **Timeout (seconds)**,
     **History window (hours)**, and **Status window (minutes)**.
   - Click **Save**.
3. Use **Test now** to trigger a probe (respects Min interval guard).
4. Watch the **status badge**, **success rate**, and **latency chart** update live.

> Diagnostics: `internet-monitor.html?log=debug&trace=1&net=1`

---

## 🧭 Controls & UI

- **Settings modal** (keeps the main screen clean):
  - **Probe URL** (e.g., `http://www.gstatic.com/generate_204`, `bing.com`, or `…/favicon.ico`).
  - **Min interval / Max interval (seconds)** — bounds for the adaptive cadence.
  - **Timeout (seconds)** — anything ≥ Timeout is treated as **slow/fail**.
  - **History window (hours)** — rolling data retention and chart window.
  - **Status window (minutes)** — window for status computation.
  - **Reset defaults**, **Clear history**, **Save**.
- **Main view**:
  - **Status badge** (Healthy / Unstable / Down).
  - **Current interval**, **Last test**, **windowed success rate**.
  - **Latency chart** (ms) with:
    - **Green** points/segments if latency **< Timeout**.
    - **Red** if latency **≥ Timeout** (includes timeouts).
    - **Dashed threshold line** at Timeout.
    - **Hover/touch tooltip** with timestamp & duration.

---

## 🔧 Probe Logic (High‑Level)

- `fetch(url, { mode: 'no-cors' })` + **AbortController** with configured **Timeout**.
  - **Resolves in time** → **Success** (opaque is fine for reachability).
  - **Aborts/errors** → **Failure**.
- Works for:
  - Small public assets like `/favicon.ico`.
  - **204 No Content** endpoints (e.g., `http://www.gstatic.com/generate_204`).

---

## ⏱️ Cadence (Adaptive + Guardrails)

- **Initial interval:** Midpoint between **Min** and **Max**.
- **On Failure:** Tighten (≈ −30%, clamped to **≥ Min**).
- **On Success:** Back off (≈ +18% + 0.5s, clamped to **≤ Max**).
- **Hard guardrail:** Never run faster than **Min** (applies to auto & manual probes).

---

## 🧮 Status (Configurable Window)

- Evaluates the last **Status window**:
  - **Healthy:** Success rate ≥ **90%**
  - **Unstable:** 60–89%
  - **Down:** < 60%
- The last probe line shows “Internet is working” vs “Internet is bad” based on result vs Timeout.

---

## 📈 Latency Chart (Rolling History)

- X-axis: Relative time across **History window**.
- Y-axis: **Latency (ms)**; dashed line marks **Timeout** threshold.
- Coloring: **Green** if latency < Timeout; **Red** otherwise.
- Redraws on resize; supports hover and touch.

---

## 💾 Persistence

- **History** (rolling by History window) and **Settings** persist in `localStorage`.
- In strict privacy modes, localStorage may be disabled.

---

## ✅ Recommended URLs

- Public, small assets like **`/favicon.ico`**.
- **`http://www.gstatic.com/generate_204`** for 204‑No‑Content reachability checks.

---

## 🧩 Troubleshooting

- **No persistence**: Privacy mode or enterprise policy may block `localStorage`.
- **Unexpected failures**: Ensure the target is public/reachable; try a known CDN endpoint.

---

## 🔍 Optional Diagnostics

Append query params:

- `?log=debug` — verbose logs
- `&trace=1` — grouped logs (`runOnce()`, `updateUI()`, `probeOnce()`)
- `&net=1` — times network operations

Example:  
`internet-monitor.html?log=debug&trace=1&net=1`

---

*exist is fully client‑side. Save the HTML and run—no external dependencies.*
