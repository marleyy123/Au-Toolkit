import type { TikTokLiveData } from '../../types';

/** Freeze a video frame before the native exporter rebuilds the preview. */
export async function prepareTikTokLiveExportData(data: TikTokLiveData): Promise<TikTokLiveData> {
  if (data.liveMediaType !== 'video' || !data.liveMediaUrl) return data;
  const video = Array.from(document.querySelectorAll<HTMLVideoElement>('#export-tiktok-live video'))
    .find(element => element.dataset.liveMediaSource === data.liveMediaUrl);
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    throw new Error('Wait until the LIVE background video has loaded before exporting.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The LIVE video frame could not be captured.');
  context.drawImage(video, 0, 0);
  return { ...data, liveMediaType: 'image', liveMediaUrl: canvas.toDataURL('image/png') };
}
