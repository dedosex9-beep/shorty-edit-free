const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');
const tempDir = path.join(__dirname, 'temp');

[uploadDir, outputDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const jobs = new Map();

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = /image\/(png|jpeg|jpg)/.test(file.mimetype);
    const isAudio = /audio\/(mpeg|wav|aac|mp4)/.test(file.mimetype);
    if (isImage || isAudio) return cb(null, true);
    cb(new Error('Only PNG, JPG, MP3, WAV, or AAC files allowed'));
  },
});

app.use(express.static('public'));
app.use('/outputs', express.static(outputDir));
app.use(express.json());

// ====== BEAT DETECTION ======
function analyzeBeats(duration) {
  // Simulate beat detection at 120 BPM = 2 beats per second
  const beats = [];
  for (let t = 0.5; t < duration; t += 0.5) {
    beats.push({
      time: t,
      energy: 30 + Math.random() * 70,
      isMajor: Math.random() > 0.7,
    });
  }
  return beats;
}

// ====== VIDEO RENDERING ======
function renderReel(jobId, imagePaths, audioPath, style) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputDir, `${jobId}.mp4`);
    const job = jobs.get(jobId);
    
    if (!job) return reject(new Error('Job not found'));
    
    try {
      // Get audio duration
      ffmpeg(audioPath).ffprobe((err, metadata) => {
        if (err) {
          job.status = 'failed';
          job.error = err.message;
          return reject(err);
        }
        
        const duration = metadata.format.duration || 30;
        const framesPerImage = Math.ceil((duration / imagePaths.length) * 30); // 30fps
        
        // Build filter complex for all images
        let filterParts = [];
        let concatStr = '';
        
        imagePaths.forEach((imgPath, idx) => {
          // Scale and pad to 1080x1920 vertical
          let filter = `[${idx}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
          
          // Apply style effects
          if (style === 'Cinematic') {
            filter += ',eq=brightness=0.05:contrast=1.2:saturation=0.9';
          } else if (style === 'Luxury') {
            filter += ',eq=saturation=0.75:brightness=0.02';
          } else if (style === 'Trendy') {
            filter += ',eq=saturation=1.3:brightness=0.05';
          }
          
          // Extend frame duration and format
          filter += `,fps=30,format=yuv420p[v${idx}];`;
          filterParts.push(filter);
          concatStr += `[v${idx}]`;
        });
        
        const finalFilter = filterParts.join('') + `${concatStr}concat=n=${imagePaths.length}:v=1:a=0[vout]`;
        
        // Build FFmpeg command
        let cmd = ffmpeg();
        
        // Add all images as inputs
        imagePaths.forEach(imgPath => {
          cmd = cmd.input(imgPath);
        });
        
        cmd = cmd.input(audioPath)
          .complexFilter(finalFilter, ['vout'])
          .inputOptions(`-t`, Math.ceil(duration))
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions('-pix_fmt', 'yuv420p')
          .outputOptions('-movflags', '+faststart')
          .on('progress', (progress) => {
            if (progress.percent) {
              job.progress = Math.min(95, Math.round(35 + (progress.percent * 0.6)));
            }
          })
          .on('stderr', () => {})
          .on('error', (err) => {
            job.status = 'failed';
            job.error = err.message;
            reject(err);
          })
          .on('end', () => {
            job.status = 'completed';
            job.progress = 100;
            job.outputUrl = `/outputs/${jobId}.mp4`;
            resolve(outputFile);
          })
          .save(outputFile);
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      reject(error);
    }
  });
}

// ====== API ROUTES ======
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', app: 'Shorty Edit Free' });
});

app.post('/api/create-reel', upload.fields([
  { name: 'images', maxCount: 50 },
  { name: 'audio', maxCount: 1 },
]), async (req, res) => {
  try {
    const images = req.files?.images || [];
    const audioFile = req.files?.audio?.[0];
    const style = req.body.style || 'Cinematic';
    
    if (!images.length) {
      return res.status(400).json({ ok: false, error: 'No images uploaded' });
    }
    if (!audioFile) {
      return res.status(400).json({ ok: false, error: 'No audio uploaded' });
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job = {
      id: jobId,
      status: 'analyzing',
      progress: 10,
      style,
      imageCount: images.length,
      outputUrl: null,
      error: null,
      createdAt: new Date().toISOString(),
    };
    
    jobs.set(jobId, job);
    
    // Sort images and get paths
    const sortedImages = images.sort((a, b) => a.originalname.localeCompare(b.originalname));
    const imagePaths = sortedImages.map(img => img.path);
    const audioPath = audioFile.path;
    
    // Analyze beats
    job.progress = 20;
    const beats = analyzeBeats(30);
    job.beats = beats;
    
    // Start rendering in background
    job.status = 'rendering';
    job.progress = 30;
    
    renderReel(jobId, imagePaths, audioPath, style)
      .then(() => {
        // Cleanup uploaded files
        [...sortedImages, audioFile].forEach(f => {
          try { fs.unlinkSync(f.path); } catch (e) {}
        });
      })
      .catch(err => {
        console.error(`[${jobId}] Render error:`, err);
        job.status = 'failed';
        job.error = err.message;
      });
    
    res.json({
      ok: true,
      jobId,
      status: 'analyzing',
      progress: 10,
      message: 'Uploading and analyzing beats...',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }
  res.json({ ok: true, job });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n🎬 Shorty Edit Free - Beat-Sync Reel Maker');
  console.log(`🌐 Running on http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${uploadDir}`);
  console.log('\n');
});
