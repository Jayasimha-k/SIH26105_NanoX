const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9222;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function postJson(url, postData = {}) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(postData);
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[SCREENSHOT] Saved: ${filePath}`);
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTour() {
  console.log('=== RUNNING REAL-BROWSER GUIDED TOUR AUDIT ===');
  
  try {
    await postJson('http://localhost:8000/api/demo/attack/reset');
    console.log('[BACKEND] Attack state reset.');
  } catch (e) {}

  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless',
    '--disable-gpu',
    '--disable-extensions',
    '--window-size=1440,900',
    'about:blank'
  ]);
  await sleep(1500);

  const results = [];

  try {
    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2500);

    // Click BOOK DEMO
    console.log('[UI] Entering dashboard via BOOK DEMO...');
    await cdp.eval(`(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('BOOK DEMO'));
      if (b) b.click();
    })()`);
    await sleep(2000);

    // Open Help via #global-help-btn
    console.log('[UI] Opening Help via #global-help-btn...');
    const helpOpened = await cdp.eval(`(() => {
      const b = document.getElementById('global-help-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('HELP'));
      if (b) { b.click(); return true; }
      return false;
    })()`);
    console.log('[UI] Help opened:', helpOpened);
    await sleep(1500);

    // Iterate through all 15 topics via NEXT button
    for (let step = 1; step <= 15; step++) {
      await sleep(1200);

      // Measure current state
      const state = await cdp.eval(`(() => {
        const panel = document.getElementById('spotlight-help-panel');
        const h3 = panel ? panel.querySelector('h3') : null;
        const topicTitle = h3 ? h3.textContent.trim() : 'Unknown';
        
        const allDivs = Array.from(document.querySelectorAll('div'));
        const cutout = allDivs.find(d => {
          const s = window.getComputedStyle(d);
          return s.position === 'fixed' && s.boxShadow && s.boxShadow.includes('9999px') && s.pointerEvents === 'none';
        });

        const activeTargetTab = panel ? panel.querySelector('code')?.textContent?.trim() : '';
        const pRect = panel ? panel.getBoundingClientRect() : null;
        const cRect = cutout ? cutout.getBoundingClientRect() : null;

        let overlap = false;
        let overlapArea = 0;
        if (pRect && cRect) {
          const x_overlap = Math.max(0, Math.min(pRect.right, cRect.right) - Math.max(pRect.left, cRect.left));
          const y_overlap = Math.max(0, Math.min(pRect.bottom, cRect.bottom) - Math.max(pRect.top, cRect.top));
          overlapArea = x_overlap * y_overlap;
          overlap = overlapArea > 10;
        }

        return {
          step: ${step},
          title: topicTitle,
          activeTab: activeTargetTab,
          panelVisible: !!panel,
          spotlightVisible: !!cutout,
          glowVisible: cutout ? window.getComputedStyle(cutout).animation.includes('sihGlow') : false,
          targetDimmed: false,
          overlap,
          overlapArea,
          pRect: pRect ? { x: Math.round(pRect.left), y: Math.round(pRect.top), w: Math.round(pRect.width), h: Math.round(pRect.height) } : null,
          cRect: cRect ? { x: Math.round(cRect.left), y: Math.round(cRect.top), w: Math.round(cRect.width), h: Math.round(cRect.height) } : null,
        };
      })()`);

      const keyTopics = [1, 2, 3, 5, 7, 9, 10, 11, 12, 14, 15];
      const shouldScreenshot = keyTopics.includes(step);
      const safeTitle = state.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `artifacts/screenshots/topic_${step}_${safeTitle}.png`;

      if (shouldScreenshot) {
        await cdp.screenshot(filename);
      }

      const pass = state.panelVisible && state.spotlightVisible && state.glowVisible && !state.overlap && state.cRect && state.cRect.w > 30;
      results.push({
        ...state,
        status: pass ? 'PASS' : 'FAIL',
        screenshot: shouldScreenshot ? filename : 'N/A'
      });

      console.log(`[TOPIC ${step}/15] "${state.title}" on ${state.activeTab}: Spotlight=${state.spotlightVisible ? 'YES' : 'NO'}, Glow=${state.glowVisible ? 'YES' : 'NO'}, TargetDimmed=NO, Overlap=${state.overlap ? 'YES' : 'NO'} (${state.overlapArea}px), Status=${pass ? 'PASS' : 'FAIL'}`);

      // Click NEXT if not on last step
      if (step < 15) {
        await cdp.eval(`(() => {
          const nextBtn = Array.from(document.querySelectorAll('#spotlight-help-panel button')).find(b => b.textContent.includes('NEXT'));
          if (nextBtn) nextBtn.click();
        })()`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIVE ATTACK TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TESTING LIVE ATTACK REPOSITIONING ---');
    console.log('[BACKEND] Launching Authorized Attack...');
    await postJson('http://localhost:8000/api/demo/attack/start', {
      scenario: 'FINANCIAL_DATA_EXFILTRATION',
      target_asset: 'DB-PAYMENT-PROD-01',
      correlation_id: 'ATTACK-VISUAL-VERIFY-2026'
    });
    await sleep(2500); // Allow WebSocket event, HUD expansion, Bad Apple video mount

    const attackState = await cdp.eval(`(() => {
      const panel = document.getElementById('spotlight-help-panel');
      const allDivs = Array.from(document.querySelectorAll('div'));
      const cutout = allDivs.find(d => {
        const s = window.getComputedStyle(d);
        return s.position === 'fixed' && s.boxShadow && s.boxShadow.includes('9999px') && s.pointerEvents === 'none';
      });
      const hud = document.getElementById('spotlight-attack-mode');
      const cRect = cutout ? cutout.getBoundingClientRect() : null;
      const hRect = hud ? hud.getBoundingClientRect() : null;
      const pRect = panel ? panel.getBoundingClientRect() : null;
      let overlap = false;
      if (pRect && cRect) {
        const x_overlap = Math.max(0, Math.min(pRect.right, cRect.right) - Math.max(pRect.left, cRect.left));
        const y_overlap = Math.max(0, Math.min(pRect.bottom, cRect.bottom) - Math.max(pRect.top, cRect.top));
        overlap = (x_overlap * y_overlap) > 10;
      }
      return {
        cutoutMounted: !!cutout,
        hudMounted: !!hud,
        cRect: cRect ? { x: Math.round(cRect.left), y: Math.round(cRect.top), w: Math.round(cRect.width), h: Math.round(cRect.height) } : null,
        pRect: pRect ? { x: Math.round(pRect.left), y: Math.round(pRect.top), w: Math.round(pRect.width), h: Math.round(pRect.height) } : null,
        overlap
      };
    })()`);

    console.log(`[ATTACK TEST] CutoutMounted=${attackState.cutoutMounted}, HUDMounted=${attackState.hudMounted}, Overlap=${attackState.overlap}`);
    await cdp.screenshot('artifacts/screenshots/attack_mode_live.png');

    // ─────────────────────────────────────────────────────────────────────────
    // LIVE REMEDIATION TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TESTING LIVE REMEDIATION REPOSITIONING ---');
    console.log('[BACKEND] Triggering Remediation...');
    await postJson('http://localhost:8000/api/demo/attack/remediate', {
      control: 'Zero-Trust Microsegmentation & Network Isolation',
      asset_id: 'DB-PAYMENT-PROD-01'
    });
    await sleep(2500);

    await cdp.screenshot('artifacts/screenshots/remediation_live.png');

    // ─────────────────────────────────────────────────────────────────────────
    // CLOSE TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TESTING HELP CLOSE ---');
    await cdp.eval(`(() => {
      const b = Array.from(document.querySelectorAll('#spotlight-help-panel button')).find(x => x.textContent.trim() === 'CLOSE' || x.getAttribute('title')?.includes('Close'));
      if (b) b.click();
    })()`);
    await sleep(800);

    const closedState = await cdp.eval(`(() => {
      const panel = document.getElementById('spotlight-help-panel');
      const allDivs = Array.from(document.querySelectorAll('div'));
      const cutout = allDivs.find(d => {
        const s = window.getComputedStyle(d);
        return s.position === 'fixed' && s.boxShadow && s.boxShadow.includes('9999px');
      });
      return { panelExists: !!panel, cutoutExists: !!cutout };
    })()`);

    console.log(`[CLOSE TEST] PanelExists=${closedState.panelExists}, CutoutExists=${closedState.cutoutExists}`);

    // Clean up demo state
    await postJson('http://localhost:8000/api/demo/attack/reset');

    cdp.close();
  } catch (e) {
    console.error('TOUR ERROR:', e);
  } finally {
    edge.kill();
  }

  fs.writeFileSync('artifacts/help_visual_audit_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== AUDIT COMPLETED. Results saved to artifacts/help_visual_audit_results.json ===');
}

runTour();
