import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const styles = ['Dynamic', 'Minimal', 'Cinematic', 'Luxury', 'Trendy'];

function App() {
  const [files, setFiles] = React.useState([]);
  const [prompt, setPrompt] = React.useState(
    "Create a 30-second reel from my 10 t-shirt mockups. Make it realistic, premium, fashion-forward, and synced to the rhythm of the music. Use smooth transitions, product closeups, lighting, and captions."
  );
  const [selectedStyle, setSelectedStyle] = React.useState('Cinematic');
  const [job, setJob] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setFiles(nextFiles);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setStatus({ ok: false, message: 'Please select at least one video or mockup file.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ ok: true, message: 'Uploading your files...' });

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const uploadResponse = await fetch('http://localhost:5000/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.ok) {
        throw new Error(uploadData.error || 'Upload failed.');
      }

      setStatus({ ok: true, message: 'Files uploaded. Starting AI edit job...' });

      const jobResponse = await fetch('http://localhost:5000/api/edits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: prompt,
          stylePreset: selectedStyle,
          files: uploadData.files,
        }),
      });

      const jobData = await jobResponse.json();
      if (!jobResponse.ok || !jobData.ok) {
        throw new Error(jobData.error || 'Job creation failed.');
      }

      setJob(jobData);
      setStatus({ ok: true, message: 'AI edit job started successfully.' });
      pollJob(jobData.jobId);
    } catch (error) {
      setStatus({ ok: false, message: error.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJob = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/edits/${jobId}/status`);
        const data = await res.json();

        if (!res.ok) {
          clearInterval(interval);
          setStatus({ ok: false, message: data.error || 'Status check failed.' });
          return;
        }

        setJob((prev) => ({ ...prev, ...data }));

        if (data.status === 'completed') {
          clearInterval(interval);
          setStatus({ ok: true, message: 'Your reel is ready to review.' });
        }
      } catch (error) {
        clearInterval(interval);
        setStatus({ ok: false, message: 'Could not poll job state.' });
      }
    }, 1800);
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
          <button>Export</button>
        </nav>
      </header>

      <main className="hero-grid">
        <section className="copy-panel">
          <span className="chip">For reels • stories • mockups • product shots</span>
          <h1>Turn raw clips into polished reels in 3 simple steps.</h1>
          <p>
            Upload your videos or mockups, describe the edit, choose a style, and let the AI
            build a clean, cinematic video ready for Instagram Reels, TikTok, or Shorts.
          </p>

          <div className="stats-row">
            <div>
              <strong>30s</strong>
              <span>Ready in one click</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>Captions + cuts</span>
            </div>
            <div>
              <strong>MP4</strong>
              <span>Export ready</span>
            </div>
          </div>
        </section>

        <section className="editor-panel">
          <label className="upload-box">
            <input type="file" multiple onChange={handleFileChange} />
            <div className="upload-inner">
              <div className="upload-icon">⬆️</div>
              <strong>Drop your files here</strong>
              <span>MP4, MOV, PNG mockups, or image sequences</span>
            </div>
          </label>

          <div className="file-list">
            {files.length === 0 ? (
              <span className="placeholder">No files selected yet</span>
            ) : (
              files.map((file, index) => (
                <div className="file-pill" key={`${file.name}-${index}`}>
                  {file.name}
                </div>
              ))
            )}
          </div>

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

          <label className="prompt-label">AI prompt</label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
          />

          <button className="primary-btn" onClick={handleUpload} disabled={isSubmitting}>
            {isSubmitting ? 'Creating your reel...' : 'Auto Edit'}
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
              <span className="small-label">Job</span>
              <h3>{job.jobId}</h3>
            </div>
            <span className={`status-pill ${job.status}`}>{job.status}</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
          </div>

          <div className="job-meta">
            <div>
              <span>Style</span>
              <strong>{job.stylePreset || selectedStyle}</strong>
            </div>
            <div>
              <span>Prompt</span>
              <strong>{job.description || prompt}</strong>
            </div>
            {job.downloadUrl && (
              <div>
                <span>Output</span>
                <a href={`http://localhost:5000${job.downloadUrl}`} target="_blank" rel="noreferrer">
                  Open export
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
