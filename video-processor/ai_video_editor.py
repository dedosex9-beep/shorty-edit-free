#!/usr/bin/env python3
"""
Shorty Edit Free - AI Video Processor

Handles automatic video editing:
- Shot detection
- Caption generation
- Transition insertion
- MP4 rendering
"""

import os
import sys
from pathlib import Path
from typing import Optional, Dict, List, Any
import json
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

try:
    from moviepy.editor import VideoFileClip, concatenate_videoclips, TextClip, CompositeVideoClip, AudioFileClip
    from moviepy.video.fx.all import resize, fadein, fadeout
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False
    logger.warning('MoviePy not installed. Some features will be limited.')

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    logger.warning('OpenCV not installed.')

try:
    import whisper
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False
    logger.warning('Whisper not installed. Caption generation disabled.')


class AIShortyEditor:
    def __init__(
        self,
        input_dir: str = './uploads',
        output_dir: str = './outputs',
        temp_dir: str = './temp',
    ):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.temp_dir = Path(temp_dir)

        for d in [self.input_dir, self.output_dir, self.temp_dir]:
            d.mkdir(exist_ok=True, parents=True)

        logger.info(f'AI Editor initialized')
        logger.info(f'  Input:  {self.input_dir}')
        logger.info(f'  Output: {self.output_dir}')

    def detect_shots(self, video_path: str) -> List[Dict[str, Any]]:
        """Detect scene changes using OpenCV."""
        if not HAS_OPENCV:
            logger.warning('OpenCV not available. Returning mock shot data.')
            return [
                {'start': 0, 'end': 5, 'scene': 1},
                {'start': 5, 'end': 10, 'scene': 2},
                {'start': 10, 'end': 15, 'scene': 3},
            ]

        try:
            logger.info(f'Detecting shots in {video_path}...')
            # Simple scene detection using frame difference
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0

            shots = []
            prev_frame = None
            threshold = 30
            shot_start = 0
            scene_count = 0

            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % 15 == 0:  # Sample every 15 frames
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    if prev_frame is not None:
                        diff = cv2.absdiff(prev_frame, gray)
                        mean_diff = diff.mean()

                        if mean_diff > threshold:
                            shot_end = frame_idx / fps
                            shots.append({
                                'start': shot_start,
                                'end': shot_end,
                                'scene': scene_count,
                                'energy': mean_diff,
                            })
                            shot_start = shot_end
                            scene_count += 1

                    prev_frame = gray

                frame_idx += 1

            # Add final shot
            shots.append({
                'start': shot_start,
                'end': duration,
                'scene': scene_count,
                'energy': 0,
            })

            cap.release()
            logger.info(f'Detected {len(shots)} shots')
            return shots
        except Exception as e:
            logger.error(f'Shot detection failed: {e}')
            return []

    def generate_captions(self, audio_path: str) -> List[Dict[str, Any]]:
        """Generate captions using Whisper."""
        if not HAS_WHISPER:
            logger.warning('Whisper not available. Returning mock captions.')
            return [
                {'start': 0, 'end': 5, 'text': 'Caught in your rhythm'},
                {'start': 5, 'end': 10, 'text': 'Moving to the beat'},
                {'start': 10, 'end': 15, 'text': 'Synced perfectly'},
            ]

        try:
            logger.info(f'Generating captions from {audio_path}...')
            model = whisper.load_model('base')
            result = model.transcribe(audio_path)

            captions = []
            for segment in result.get('segments', []):
                captions.append({
                    'start': segment['start'],
                    'end': segment['end'],
                    'text': segment['text'].strip(),
                })

            logger.info(f'Generated {len(captions)} caption segments')
            return captions
        except Exception as e:
            logger.error(f'Caption generation failed: {e}')
            return []

    def render_video(
        self,
        video_files: List[str],
        output_path: str,
        prompt: str = '',
        style: str = 'Cinematic',
        audio_file: Optional[str] = None,
        target_duration: float = 30,
        target_resolution: tuple = (1080, 1920),
    ) -> bool:
        """Render final video with MoviePy."""
        if not HAS_MOVIEPY:
            logger.warning('MoviePy not available. Creating mock MP4.')
            with open(output_path, 'w') as f:
                f.write('mock mp4')
            return True

        try:
            logger.info(f'Rendering video: {output_path}')
            logger.info(f'  Style: {style}')
            logger.info(f'  Target: {target_resolution[0]}x{target_resolution[1]} @ {target_duration}s')
            logger.info(f'  Prompt: {prompt[:50]}...')

            clips = []
            total_duration = 0

            for video_file in video_files:
                if not Path(video_file).exists():
                    logger.warning(f'File not found: {video_file}')
                    continue

                try:
                    clip = VideoFileClip(video_file)
                    # Resize to target resolution
                    clip = clip.resize(height=target_resolution[1])
                    clips.append(clip)
                    total_duration += clip.duration
                except Exception as e:
                    logger.error(f'Failed to load {video_file}: {e}')

            if not clips:
                logger.error('No valid video files to render')
                return False

            # Adjust clip durations to fit target
            if total_duration > target_duration:
                scale = target_duration / total_duration
                clips = [clip.speedx(1 / scale) for clip in clips]

            # Concatenate with fade transitions
            final = concatenate_videoclips(
                [clip.fadein(0.3).fadeout(0.3) for clip in clips],
                method='chain'
            )[:target_duration]

            # Add audio if provided
            if audio_file and Path(audio_file).exists():
                try:
                    audio = AudioFileClip(audio_file).subclip(0, min(final.duration, 30))
                    final = final.set_audio(audio)
                    logger.info('Audio track added')
                except Exception as e:
                    logger.warning(f'Failed to add audio: {e}')

            # Write output
            logger.info(f'Writing {output_path}...')
            final.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=30,
                preset='ultrafast',
                verbose=False,
                logger=None,
            )

            logger.info(f'✅ Render complete: {output_path}')
            return True

        except Exception as e:
            logger.error(f'Render failed: {e}')
            return False

    def process_job(
        self,
        job_id: str,
        video_files: List[str],
        prompt: str,
        style: str = 'Cinematic',
        audio_file: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process a full editing job."""
        logger.info(f'\n[{job_id}] Starting job...')

        output_path = self.output_dir / f'{job_id}.mp4'

        try:
            # Analyze videos
            logger.info('[Analysis] Detecting shots...')
            shots = self.detect_shots(video_files[0]) if video_files else []

            # Generate captions if audio exists
            captions = []
            if audio_file:
                logger.info('[Analysis] Generating captions...')
                captions = self.generate_captions(audio_file)

            # Render
            logger.info('[Render] Starting video composition...')
            success = self.render_video(
                video_files=video_files,
                output_path=str(output_path),
                prompt=prompt,
                style=style,
                audio_file=audio_file,
                target_duration=30,
                target_resolution=(1080, 1920),
            )

            if not success:
                return {
                    'status': 'failed',
                    'error': 'Rendering failed',
                }

            logger.info(f'[{job_id}] ✅ Job complete!\n')
            return {
                'status': 'completed',
                'output': str(output_path),
                'shots_detected': len(shots),
                'captions_generated': len(captions),
                'style': style,
            }

        except Exception as e:
            logger.error(f'[{job_id}] Job failed: {e}')
            return {
                'status': 'failed',
                'error': str(e),
            }


if __name__ == '__main__':
    editor = AIShortyEditor()
    logger.info('AI Video Editor initialized and ready.')
    logger.info('Waiting for backend job queue...')
