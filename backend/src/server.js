const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const rootDir = path.join(__dirname, '..');
const uploadDir = path.join(rootDir, 'uploads');
const outputDir = path.join(rootDir, 'outputs');
const pythonScriptsDir = path.join(rootDir, '..', 'video-processor');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb' }));
app.use('/uploads', express.static(uploadDir));
app.use('/outputs', express.static(outputDir));

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

const jobs = new Map();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'shorty-edit-free', status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/edits/create', upload.fields([{ name: 'files', maxCount: 50 }, { name: 'audio', maxCount: 1 }]), (req, res) => {
  try {
    const { prompt = 'Create a clean, professional reel.', style = 'Cinematic' } = req.body;
    const videoFiles = req.files?.files || [];
    const audioFile = req.files?.audio?.[0];

    if (!videoFiles.length) {
      return res.status(400).json({ ok: false, error: 'No video/image files provided.' });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const jobData = {
      jobId,
      status: 'processing',
      progress: 0,
      description: prompt,
      stylePreset: style,
      videoFiles: videoFiles.map((f) => ({ name: f.filename, path: f.path, size: f.size })),
      audioFile: audioFile ? { name: audioFile.filename, path: audioFile.path } : null,
      downloadUrl: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      duration: null,
    };

    jobs.set(jobId, jobData);

    // Simulate progress updates (replace with real Python call later)
    let progress = 0;
    const progressInterval = setInterval(() => {
      const job = jobs.get(jobId);
      if (!job) {
        clearInterval(progressInterval);
        return;
      }

      progress += Math.random() * 15;
      if (progress >= 100) {
        clearInterval(progressInterval);
        job.progress = 100;
        job.status = 'completed';
        job.downloadUrl = `/outputs/${jobId}.mp4`;
        job.completedAt = new Date().toISOString();
        // Create a mock MP4 file
        fs.writeFileSync(path.join(outputDir, `${jobId}.mp4`), Buffer.from('mock mp4 data'));
        return;
      }

      job.progress = Math.min(Math.floor(progress), 99);
      job.startedAt = new Date().toISOString();
    }, 1500);

    res.json({
      ok: true,
      ...jobData,
    });

    console.log(`[Job ${jobId}] Created with ${videoFiles.length} video(s) and style "${style}"`);
  } catch (error) {
    console.error('Error in /api/edits/create:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/edits/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found.' });
  }

  res.json({ ok: true, ...job });
});

app.get('/api/edits/:jobId/download', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || !job.downloadUrl) {
    return res.status(404).json({ ok: false, error: 'Render not available yet.' });
  }

  res.json({ ok: true, downloadUrl: job.downloadUrl });
});

app.get('/api/jobs', (_req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, jobs: allJobs });
});

app.listen(PORT, () => {
  console.log(`\n🎬 Shorty Editor Backend`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${uploadDir}`);
  console.log(`📁 Outputs: ${outputDir}\n`);
});
