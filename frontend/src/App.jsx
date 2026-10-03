import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const styles = ['Dynamic', 'Minimal', 'Cinematic', 'Luxury', 'Trendy'];
const API_URL = 'http://localhost:5000';

function App() {
  const [files, setFiles] = React.useState([]);
  const [prompt, setPrompt] = React.useState(
    "Create a 30-second premium reel. Make it realistic, fashion-forward, synced to music rhythm. Smooth transitions, product closeups, professional lighting, and captions."
  );
  const [selectedStyle, setSelectedStyle] = React.useState('Cinematic');
  const [audioFile, setAudioFile] = React.useState(null);
  const [job, setJob] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [jobs, setJobs] = React.useState([]);

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setFiles(nextFiles);
  };

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setStatus({ ok: true, message: `Audio selected: ${file.name}` });
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      setStatus({ ok: false, message: '❌ Please select at least one video or mockup file.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ ok: true, message: '📤 Uploading your files...' });

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (audioFile) formData.append('audio', audioFile);
    formData.append('prompt', prompt);
    formData.append('style', selectedStyle);

    try {
      const response = await fetch(`${API_URL}/api/edits/create`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Job creation failed.');
      }

      setJob(data);
      setJobs((prev) => [data, ...prev]);
      setStatus({ ok: true, message: '🚀 AI job started! Processing your reel...' });
      pollJob(data.jobId);
    } catch (error) {
      setStatus({ ok: false, message: `❌ ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJob = async (jobId) => {
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max polling

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        setStatus({ ok: false, message: '⏱️ Processing timed out. Check backend logs.' });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/edits/${jobId}/status`);
        const data = await res.json();

        if (!res.ok) {
          clearInterval(interval);
          setStatus({ ok: false, message: data.error || 'Status check failed.' });
          return;
        }

        setJob((prev) => ({ ...prev, ...data }));
        setJobs((prev) =>
          prev.map((j) => (j.jobId === jobId ? { ...j, ...data } : j))
        );

        if (data.status === 'completed') {
          clearInterval(interval);
          setStatus({ ok: true, message: '✅ Your reel is ready! Download below.' });
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus({ ok: false, message: `❌ Rendering failed: ${data.error || 'Unknown error'}` });
        }
      } catch (error) {
        // Silently continue polling on network errors
      }
    }, 2000);
  };

  const downloadReel = (jobId, downloadUrl) => {
    if (downloadUrl) {
      window.open(`${API_URL}${downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">🎬</div>
          <div>
            <div className="brand-name">Shorty</div>
            <div className="brand-sub">AI Video Editor</div>
          </div>
        </div>
        <nav className="topnav">
          <button>Home</button>
          <button>Editor</button>
          <button>Jobs ({jobs.length})</button>
        </nav>
      </header>

      <main className="hero-grid">
        <section className="copy-panel">
          <span className="chip">For reels • stories • mockups • product shots</span>
          <h1>Turn raw clips into viral reels in 3 clicks.</h1>
          <p>
            Upload your videos or mockups, describe the edit, add audio, pick a style, and let AI
            build a professional short ready for Instagram, TikTok, or YouTube Shorts.
          </p>

          <div className="stats-row">
            <div>
              <strong>30s</strong>
              <span>Export ready</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>Auto captions</span>
            </div>
            <div>
              <strong>MP4</strong>
              <span>4K capable</span>
            </div>
          </div>
        </section>

        <section className="editor-panel">
          <label className="upload-box">
            <input type="file" multiple onChange={handleFileChange} accept="image/*,video/*" />
            <div className="upload-inner">
              <div className="upload-icon">📹</div>
              <strong>Drop videos or mockups here</strong>
              <span>MP4, MOV, PNG images, or sequences</span>
            </div>
          </label>

          <div className="file-list">
            {files.length === 0 ? (
              <span className="placeholder">No files yet</span>
            ) : (
              files.map((file, index) => (
                <div className="file-pill" key={`${file.name}-${index}`}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </div>
              ))
            )}
          </div>

          <label className="audio-label">Add background audio (optional)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="audio-input"
          />
          {audioFile && <div className="audio-selected">🎵 {audioFile.name}</div>}

          <div className="style-row">
            {styles.map((style) => (
              <button
                key={style}
                className={selectedStyle === style ? 'style-btn active' : 'style-btn'}
                onClick={() => setSelectedStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>

          <label className="prompt-label">AI Prompt</label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            placeholder="Describe how you want your reel edited..."
          />

          <button className="primary-btn" onClick={handleUpload} disabled={isSubmitting || !files.length}>
            {isSubmitting ? '⏳ Processing...' : '🚀 Create Reel'}
          </button>

          {status && (
            <div className={status.ok ? 'status success' : 'status error'}>
              {status.message}
            </div>
          )}
        </section>
      </main>

      {job && (
        <section className="result-card">
          <div className="job-header">
            <div>
              <span className="small-label">Current Job</span>
              <h3>{job.jobId}</h3>
            </div>
            <span className={`status-pill ${job.status}`}>
              {job.status === 'completed' ? '✅ Done' : job.status === 'failed' ? '❌ Failed' : '⏳ ' + job.status}
            </span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
          </div>
          <div className="progress-text">{job.progress || 0}%</div>

          <div className="job-meta">
            <div>
              <span>Style</span>
              <strong>{job.stylePreset || selectedStyle}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{job.duration || '~30s'}</strong>
            </div>
            {job.downloadUrl && (
              <div>
                <span>Export</span>
                <button
                  className="download-btn"
                  onClick={() => downloadReel(job.jobId, job.downloadUrl)}
                >
                  📥 Download
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {jobs.length > 1 && (
        <section className="jobs-history">
          <h3>Recent Jobs</h3>
          <div className="jobs-list">
            {jobs.slice(1, 6).map((j) => (
              <div key={j.jobId} className="job-item">
                <span>{j.jobId}</span>
                <span className={`status-badge ${j.status}`}>{j.status}</span>
                {j.downloadUrl && (
                  <button
                    className="mini-download"
                    onClick={() => downloadReel(j.jobId, j.downloadUrl)}
                  >
                    📥
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
