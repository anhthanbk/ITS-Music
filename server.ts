import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server-side Google GenAI initialization with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // AI-powered Audio Listening & Lyrics Transcription API Route using Gemini 3.8 Flash
  app.post('/api/generate-lyrics', async (req, res) => {
    try {
      const {
        title,
        artist,
        duration = 180,
        genre = 'V-Pop',
        audioBase64,
        mimeType = 'audio/mp3',
        audioUrl,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Tên bài hát là bắt buộc.' });
      }

      const songDuration = Math.max(30, Math.min(600, Number(duration) || 180));
      const mins = Math.floor(songDuration / 60);
      const secs = Math.floor(songDuration % 60);

      const contents: any[] = [];
      let hasAudioInput = false;

      // 1. Check if direct base64 audio was supplied from browser file
      if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > 100) {
        contents.push({
          inlineData: {
            mimeType: mimeType || 'audio/mp3',
            data: audioBase64,
          },
        });
        hasAudioInput = true;
      } else if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http')) {
        // 2. Fetch audio from Supabase signed URL or public URL
        try {
          const audioFetch = await fetch(audioUrl);
          if (audioFetch.ok) {
            const buf = await audioFetch.arrayBuffer();
            // Up to 20MB inline audio
            if (buf.byteLength > 0 && buf.byteLength <= 20 * 1024 * 1024) {
              const b64 = Buffer.from(buf).toString('base64');
              const ct = audioFetch.headers.get('content-type') || mimeType || 'audio/mp3';
              contents.push({
                inlineData: {
                  mimeType: ct,
                  data: b64,
                },
              });
              hasAudioInput = true;
            }
          }
        } catch (fetchErr) {
          console.warn('Could not fetch audioUrl for transcription, continuing with metadata:', fetchErr);
        }
      }

      const promptText = `Bạn là một chuyên gia thẩm âm, bóc tách lời bài hát và kỹ thuật viên căn chỉnh nhịp phách Karaoke chuyên nghiệp.
${
  hasAudioInput
    ? `HÃY LẮNG NGHE KỸ TỆP ÂM THANH ĐƯỢC ĐÍNH KÈM VÀ BÓC TÁCH CHÍNH XÁC LỜI BÀI HÁT TỪ GIỌNG HÁT THẬT ĐANG HÁT TRONG BÀI:
- Tên bài hát: "${title.trim()}"
- Nghệ sĩ / Ca sĩ: "${(artist || 'Nhiều nghệ sĩ').trim()}"
- Thể loại: "${genre || 'V-Pop'}"
- Thời lượng tệp âm thanh: ${songDuration} giây (${mins} phút ${secs} giây)

HƯỚNG DẪN BÓC TÁCH ÂM THANH (AUDIO TRANSCRIPTION & KARAOKE SYNC):
1. LẮNG NGHE GIỌNG HÁT TRONG TỆP ÂM THANH: Bóc tách chính xác từng từ ngữ mà ca sĩ thực tế hát trong tệp này. Tuyệt đối không bịa đặt, suy đoán hay tự thêm bớt từ ngữ khác với âm thanh thực tế.
2. ĐỒNG BỘ MỐC THỜI GIAN [mm:ss]: Xác định chuẩn xác giây bắt đầu của từng câu hát dựa trên âm thanh thực tế người hát cất tiếng.
3. Chia bài hát thành từng câu hát ngắn gọn, tự nhiên (5 đến 12 từ mỗi câu) để người dùng có thể hát Karaoke thoải mái.
4. Trải dài từ câu hát đầu tiên đến câu hát cuối cùng của bài hát.`
    : `Hãy tạo lời bài hát kèm các mốc thời gian (timestamp [mm:ss]) chuẩn cho bài hát sau để người dùng có thể hát Karaoke trực tiếp trên ứng dụng ITS Music Entertainment:
- Tên bài hát: "${title.trim()}"
- Nghệ sĩ / Ca sĩ: "${(artist || 'Nhiều nghệ sĩ').trim()}"
- Thể loại: "${genre || 'V-Pop'}"
- Thời lượng bài hát: ${songDuration} giây (khoảng ${mins} phút ${secs} giây)

HƯỚNG DẪN:
1. Nếu đây là bài hát có thật nổi tiếng, cung cấp lời bài hát chính xác, chân thực nhất.
2. Nếu là bài hát mới, sáng tác lời bài hát giàu cảm xúc, có vần điệu bắt tai.
3. Mỗi câu hát phải được gán mốc thời gian [mm:ss] từ đầu đến gần cuối bài hát.`
}

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một JSON hợp lệ (không kèm markdown \`\`\`json hay ghi chú bên ngoài) theo cấu trúc:
{
  "title": "${title.trim()}",
  "artist": "${(artist || 'Nhiều nghệ sĩ').trim()}",
  "hasListenedAudio": ${hasAudioInput},
  "rawLrc": "[00:10] Câu hát đầu tiên nghe được...\\n[00:16] Câu hát tiếp theo...\\n...",
  "lyrics": [
    { "time": 10, "text": "Câu hát đầu tiên nghe được..." },
    { "time": 16, "text": "Câu hát tiếp theo..." }
  ]
}`;

      contents.push({ text: promptText });

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: hasAudioInput ? 0.3 : 0.7,
        },
      });

      const responseText = aiResponse.text?.trim() || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleanJson = responseText
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        parsedData = JSON.parse(cleanJson);
      }

      // Validate & clean lyrics array
      const rawLyrics = Array.isArray(parsedData.lyrics) ? parsedData.lyrics : [];
      const cleanedLyrics = rawLyrics
        .map((item: any, idx: number) => ({
          time: typeof item.time === 'number' && !isNaN(item.time) ? item.time : idx * 10,
          text: String(item.text || '').trim(),
        }))
        .filter((item: any) => item.text.length > 0)
        .sort((a: any, b: any) => a.time - b.time);

      let formattedLrc = parsedData.rawLrc || '';
      if (!formattedLrc && cleanedLyrics.length > 0) {
        formattedLrc = cleanedLyrics
          .map((l: any) => {
            const m = Math.floor(l.time / 60);
            const s = Math.floor(l.time % 60);
            return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}] ${l.text}`;
          })
          .join('\n');
      }

      return res.json({
        success: true,
        lyrics: cleanedLyrics,
        rawLrc: formattedLrc,
      });
    } catch (err: any) {
      console.error('Lỗi API tạo lời bài hát Gemini:', err);
      return res.status(500).json({
        error: err?.message || 'Không thể tạo lời bài hát bằng AI.',
      });
    }
  });

  // Determine port and host
  let port = 3000;
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    port = parseInt(process.argv[portIdx + 1], 10);
  } else if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  }

  let host = '0.0.0.0';
  const hostIdx = process.argv.indexOf('--host');
  if (hostIdx !== -1 && process.argv[hostIdx + 1]) {
    host = process.argv[hostIdx + 1];
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, host, () => {
    console.log(`ITS Music Entertainment server listening at http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
