const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const rootDir = path.join(__dirname, '..');
const uploadDir = path.join(rootDir, 'uploads');
const outputDir = path.join(rootDir, 'outputs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use('/outputs', express.static(outputDir));

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

const jobs = new Map();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'shorty-edit-free', status: 'healthy' });
});

app.post('/api/videos/upload', upload.array('files', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ ok: false, error: 'No files uploaded.' });
  }

  const savedFiles = req.files.map((file) => ({
    name: file.originalname,
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    size: file.size,
  }));

  res.json({ ok: true, files: savedFiles });
});

app.post('/api/edits/create', (req, res) => {
  const { description, stylePreset = 'Cinematic', files = [] } = req.body;

  if (!files || files.length === 0) {
    return res.status(400).json({ ok: false, error: 'No files provided.' });
  }

  const jobId = `job_${Date.now()}`;

  jobs.set(jobId, {
    jobId,
    status: 'processing',
    progress: 0,
    description: description || 'Create a clean product-style reel.',
    stylePreset,
    downloadUrl: null,
    createdAt: new Date().toISOString(),
  });

  const interval = setInterval(() => {
    const current = jobs.get(jobId);
    if (!current) {
      clearInterval(interval);
      return;
    }

    if (current.progress >= 100) {
      clearInterval(interval);
      current.status = 'completed';
      current.downloadUrl = `/outputs/${jobId}.mp4`;
      current.progress = 100;
      return;
    }

    current.progress = Math.min(current.progress + 12, 100);
    if (current.progress >= 100) {
      current.status = 'completed';
      current.downloadUrl = `/outputs/${jobId}.mp4`;
      current.progress = 100;
    }
  }, 1500);

  res.json({
    ok: true,
    jobId,
    status: 'processing',
    progress: 0,
    description: description || 'Create a clean product-style reel.',
    stylePreset,
    message: 'AI job queued successfully.',
  });
});

app.get('/api/edits/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found.' });
  }

  res.json({
    ok: true,
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    description: job.description,
    stylePreset: job.stylePreset,
    downloadUrl: job.downloadUrl,
  });
});

app.get('/api/edits/:jobId/download', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || !job.downloadUrl) {
    return res.status(404).json({ ok: false, error: 'No render available yet.' });
  }

  res.json({ ok: true, downloadUrl: job.downloadUrl });
});

app.listen(PORT, () => {
  console.log(`Shorty backend listening on http://localhost:${PORT}`);
});
