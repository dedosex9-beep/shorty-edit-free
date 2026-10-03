const form = document.getElementById('reel-form');
const imageInput = document.getElementById('images');
const audioInput = document.getElementById('audio');
const styleButtons = document.querySelectorAll('.style-btn');
const styleValue = document.getElementById('style-value');
const statusBox = document.getElementById('status');
const progressBox = document.getElementById('progress-box');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const beatsBox = document.getElementById('beats-box');
const beatMap = document.getElementById('beat-map');
const beatInfo = document.getElementById('beat-info');
const resultBox = document.getElementById('result');
const submitBtn = document.getElementById('submit-btn');

let currentJobId = null;
let pollInterval = null;

// Style selection
styleButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    styleButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    styleValue.value = btn.dataset.style;
  });
});

function setStatus(type, title, text) {
  statusBox.className = `status-box ${type}`;
  statusBox.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
}

function updateProgress(percent) {
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
}

function showBeats(beats) {
  beatMap.innerHTML = '';
  const majorBeats = beats.filter(b => b.isMajor).length;
  const avgEnergy = (beats.reduce((sum, b) => sum + b.energy, 0) / beats.length).toFixed(0);
  
  beats.forEach(beat => {
    const bar = document.createElement('div');
    bar.className = 'beat-bar';
    const pct = (beat.time / 30) * 100;
    bar.style.left = `${pct}%`;
    bar.style.height = `${Math.max(8, (beat.energy / 100) * 60)}px`;
    bar.style.opacity = beat.isMajor ? 0.9 : 0.5;
    beatMap.appendChild(bar);
  });
  
  beatInfo.textContent = `${beats.length} beats • ${majorBeats} major • Energy: ${avgEnergy}`;
  beatsBox.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const images = imageInput.files;
  const audio = audioInput.files?.[0];
  
  if (!images?.length) {
    setStatus('error', '❌ No images', 'Select at least one mockup');
    return;
  }
  
  if (!audio) {
    setStatus('error', '❌ No audio', 'Select a music track');
    return;
  }
  
  submitBtn.disabled = true;
  setStatus('processing', '⏳ Uploading', 'Sending files...');
  progressBox.style.display = 'block';
  updateProgress(5);
  
  const formData = new FormData();
  for (let i = 0; i < images.length; i++) {
    formData.append('images', images[i]);
  }
  formData.append('audio', audio);
  formData.append('style', styleValue.value);
  
  try {
    const res = await fetch('/api/create-reel', {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Upload failed');
    
    currentJobId = data.jobId;
    updateProgress(15);
    setStatus('processing', '🎵 Analyzing beats', 'Detecting rhythm...');
    
    // Poll for job status
    pollJob();
  } catch (error) {
    setStatus('error', '❌ Error', error.message);
    submitBtn.disabled = false;
  }
});

function pollJob() {
  const poll = async () => {
    try {
      const res = await fetch(`/api/jobs/${currentJobId}`);
      const data = await res.json();
      
      if (!data.ok) throw new Error(data.error);
      
      const job = data.job;
      updateProgress(job.progress);
      
      if (job.status === 'analyzing') {
        setStatus('processing', '🎵 Analyzing', `${job.progress}% - Detecting beats...`);
        if (job.beats && !beatMap.innerHTML) {
          showBeats(job.beats);
        }
      } else if (job.status === 'rendering') {
        setStatus('processing', '🎬 Rendering', `${job.progress}% - Creating video...`);
      } else if (job.status === 'completed') {
        setStatus('success', '✅ Complete!', 'Your reel is ready');
        updateProgress(100);
        resultBox.className = 'result-box';
        resultBox.innerHTML = `
          <div style="width: 100%;">
            <video width="100%" controls autoplay muted>
              <source src="${job.outputUrl}" type="video/mp4" />
            </video>
            <a href="${job.outputUrl}" download class="download-btn">📥 Download MP4</a>
          </div>
        `;
        submitBtn.disabled = false;
        clearInterval(pollInterval);
        return;
      } else if (job.status === 'failed') {
        setStatus('error', '❌ Failed', job.error || 'Rendering error');
        submitBtn.disabled = false;
        clearInterval(pollInterval);
        return;
      }
      
      pollInterval = setTimeout(poll, 1000);
    } catch (error) {
      console.error('Poll error:', error);
      setStatus('error', '❌ Error', error.message);
      submitBtn.disabled = false;
      clearInterval(pollInterval);
    }
  };
  
  poll();
}
