import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Segment } from '../types';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (): Promise<void> => {
  if (ffmpeg) {
    return;
  }

  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  ffmpeg.on('log', ({ message }) => {
    console.log(message);
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
};

export const exportVideo = async (
  videoFile: File,
  segments: Segment[],
  onProgress: (progress: number) => void
): Promise<Blob> => {
  if (!ffmpeg) {
    await loadFFmpeg();
  }
  if (!ffmpeg || !ffmpeg.loaded) {
    throw new Error('FFmpeg is not loaded.');
  }

  ffmpeg.on('progress', ({ progress }) => {
    onProgress(Math.max(0, Math.min(1, progress)));
  });

  const inputFile = 'input.mp4';
  await ffmpeg.writeFile(inputFile, await fetchFile(videoFile));

  const activeSegments = segments.filter(s => s.active);
  if (activeSegments.length === 0) {
    throw new Error('No active segments to export.');
  }

  // Generate ffmpeg command
  const inputFiles: string[] = [];
  let complexFilter = '';

  activeSegments.forEach((segment, index) => {
    const outputFile = `part-${index}.mp4`;
    complexFilter += `[0:v]trim=start=${segment.start}:end=${segment.end},setpts=PTS-STARTPTS[v${index}]; `;
    complexFilter += `[0:a]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[a${index}]; `;
    inputFiles.push(`[v${index}]`);
    inputFiles.push(`[a${index}]`);
  });

  complexFilter += `${inputFiles.join('')}concat=n=${activeSegments.length}:v=1:a=1[outv][outa]`;

  const command = [
    '-i', inputFile,
    '-filter_complex', complexFilter,
    '-map', '[outv]',
    '-map', '[outa]',
    'output.mp4'
  ];

  await ffmpeg.exec(command);

  const data = await ffmpeg.readFile('output.mp4');

  // Cleanup
  await ffmpeg.deleteFile(inputFile);
  activeSegments.forEach((_, index) => {
    ffmpeg.deleteFile(`part-${index}.mp4`);
  });
  await ffmpeg.deleteFile('output.mp4');

  ffmpeg.off('progress', () => {});


  return new Blob([data], { type: 'video/mp4' });
};
