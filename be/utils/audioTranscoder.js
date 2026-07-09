import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Transcodes an audio file down to 128kbps MP3
 * @param {string} inputPath - Path to the original audio file
 * @param {string} outputPath - Path where the transcoded file should be saved
 * @returns {Promise<string>} - Resolves with the outputPath on success
 */
export function transcodeTo128kbps(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`🛠️ Starting transcode: "${inputPath}" -> "${outputPath}"`);
    ffmpeg(inputPath)
      .audioBitrate(128)
      .toFormat('mp3')
      .on('end', () => {
        console.log(`✅ Transcoded successfully: "${outputPath}"`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ Transcoding error for "${inputPath}":`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
}
