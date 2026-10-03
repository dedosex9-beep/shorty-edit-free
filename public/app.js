* {
  box-sizing: border-box;
}

:root {
  --bg: #070d18;
  --bg-2: #111827;
  --panel: rgba(17,24,39,0.9);
  --panel-soft: rgba(31,41,55,0.84);
  --line: rgba(255,255,255,0.1);
  --text: #edf6ff;
  --muted: #b9c9db;
  --primary: #7c6cff;
  --primary-2: #46d7ff;
  --success: #64f2b0;
  --warning: #ffca6c;
  --danger: #ff8c8c;
}

html, body {
  margin: 0;
  min-height: 100%;
  font-family: Inter, system-ui, sans-serif;
  background: linear-gradient(180deg, #050b15, #0c1524 35%, #0d1728);
  color: var(--text);
}

body {
  min-height: 100vh;
}

button, input, textarea {
  font: inherit;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 20px 35px rgba(0,0,0,0.18);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  font-size: 1.5rem;
}

.brand-name {
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-sub {
  color: var(--muted);
  font-size: 0.72rem;
}

.chip {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(124,108,255,0.4);
  background: rgba(124,108,255,0.12);
  color: #dcd4ff;
  font-size: 0.78rem;
  font-weight: 700;
}

.layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  margin-top: 28px;
}

.left-panel,
.right-panel {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}

.left-panel h1 {
  margin: 0 0 12px;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  line-height: 0.98;
  letter-spacing: -0.07em;
}

.lead {
  margin: 0 0 24px;
  color: var(--muted);
  line-height: 1.7;
}

.field-label {
  display: block;
  margin: 16px 0 8px;
  font-weight: 700;
  color: #dcecff;
}

input[type="file"], textarea {
  width: 100%;
}

input[type="file"] {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  padding: 12px;
}

textarea {
  resize: vertical;
  min-height: 130px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  background: rgba(3,8,14,0.4);
  color: var(--text);
}

.style-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.style-btn {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  color: var(--text);
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  transition: 150ms ease;
}

.style-btn.active {
  background: linear-gradient(135deg, rgba(124,108,255,0.18), rgba(70,215,255,0.1));
  border-color: rgba(124,108,255,0.46);
}

.primary-btn {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: white;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: 0 20px 30px rgba(124,108,255,0.28);
}

.status-box {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px 18px;
  background: rgba(255,255,255,0.02);
}

.status-box strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 6px;
}

.status-box p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.status-box.processing {
  border-color: rgba(124,108,255,0.42);
  background: rgba(124,108,255,0.08);
}

.status-box.success {
  border-color: rgba(100,242,176,0.3);
  background: rgba(100,242,176,0.08);
}

.status-box.error {
  border-color: rgba(255,140,140,0.25);
  background: rgba(255,140,140,0.08);
}

.preview-panel {
  margin-top: 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.02);
}

.preview-panel h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-list li {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.02);
  color: var(--muted);
  font-size: 0.82rem;
}

.result-box {
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px dashed rgba(255,255,255,0.14);
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  overflow: hidden;
}

.result-box.empty p {
  color: var(--muted);
  margin: 0;
}

.result-box video {
  width: 100%;
  max-height: 240px;
  border-radius: 10px;
}

.hidden {
  display: none;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
