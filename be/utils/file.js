import fs from 'fs';
import path from 'path';

export function saveBase64File(base64Data, subFolder, defaultExt = 'bin') {
  if (!base64Data) return '';
  
  // If it's already a URL path, prepend the backend URL if relative
  if (base64Data.startsWith('/uploads/')) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return `${backendUrl}${base64Data}`;
  }
  if (base64Data.startsWith('http')) {
    return base64Data;
  }
  
  let base64String = base64Data;
  let fileExt = defaultExt;
  
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    base64String = matches[2];
    
    // Extract file extension from mime type
    // e.g., "audio/mpeg" -> "mp3", "image/png" -> "png"
    const mimeExt = mimeType.split('/')[1];
    if (mimeExt) {
      if (mimeExt === 'mpeg') fileExt = 'mp3';
      else if (mimeExt === 'svg+xml') fileExt = 'svg';
      else fileExt = mimeExt;
    }
  }
  
  try {
    const buffer = Buffer.from(base64String, 'base64');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return `${backendUrl}/uploads/${subFolder}/${filename}`;
  } catch (err) {
    console.error('Failed to save uploaded file:', err);
    return '';
  }
}
