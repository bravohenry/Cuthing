<div align="center">
  <img src="assets/logo.png" alt="ChatCut Logo" width="200" style="margin: 2rem 0;" />
</div>

<h1 align="center">Cuthing · Video AI Workstation</h1>
<p align="center">
  A Nothing OS–inspired AI video editor that blends visual, audio, and conversational intelligence powered by Google Gemini.
</p>

<div align="center">
  <img src="assets/preview.png" alt="ChatCut AI Workstation Preview" width="100%" style="max-width: 1200px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 2rem 0;" />
</div>

---

## ✨ Features at a Glance

- **Multimodal intelligence** – `gemini-3-pro-preview` captures visual context, while `gemini-2.5-flash` handles audio transcription and conversational edits.
- **Timeline-aware edits** – transcript segments plus visual cues generate precise `editedSegments` that drive the playback engine.
- **Conversational workflow** – issue natural-language commands in the chat panel; the assistant replies (and can speak) via `gemini-2.5-flash-preview-tts`.
- **Dual viewers** – toggle between video or transcript views on both panes to keep source footage and edit preview in sync.
- **Vercel ready** – native Vite build, local Tailwind/PostCSS pipeline, and `vercel.json` for zero-config deployments.

---

## 🗂 Project Topography

```
├─ App.tsx                 # Main shell + business logic
├─ components/             # Sidebar, ChatPanel, Timeline, TranscriptView...
├─ services/geminiService.ts
│    ├─ analyzeVisualContent     # Keyframe vision analysis
│    ├─ generateTranscript       # Audio → text with structured segments
│    ├─ processVideoEdit         # Instruction-aware segment rewriting
│    └─ generateSpeech           # Text-to-speech for assistant replies
├─ services/audioUtils.ts  # Extract audio tracks from video files
├─ src/main.tsx            # Vite entry point
├─ src/index.css           # Global theme + Tailwind directives
├─ tailwind.config.js      # Nothing OS palette & typography
├─ vercel.json             # Framework + SPA rewrites
└─ env.example             # Environment variable template
```

---

## ⚙️ Local Development

> Requirements: Node.js 18+ (20+ recommended) and a valid Gemini API key.

```bash
npm install                      # 1. install dependencies
cp env.example .env.local        # 2. create your env file
# edit .env.local and set VITE_GEMINI_API_KEY=<your key>
npm run dev                      # 3. start Vite dev server
```

Allow microphone permissions in the browser if you want voice transcription or TTS playback.

---

## 🌐 Deploying to Vercel

1. Connect the repository in Vercel; keep the default build (`npm run build`) and output (`dist`).
2. Add environment variables in **Project Settings → Environment Variables**:
   - `VITE_GEMINI_API_KEY = <your Gemini key>`
3. Push to `main` to trigger CI/CD, or run locally:

```bash
npm run vercel:dev   # Emulator for the Vercel runtime (login/link on first run)
vercel --prod        # Trigger a production deployment from CLI
```

---

## 🧩 Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS (PostCSS pipeline)
- **UI/Branding**: Nothing OS–style components, Lucide Icons
- **AI Services**: `@google/genai` using Gemini 2.5 / 3 models
- **Hosting**: Vercel with SPA rewrites via `vercel.json`

---

## 🔐 Environment Variables

| Name | Description |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Gemini API key issued from Google AI Studio, required for every model call. |

`.env.local` is git-ignored by default; only your local runtime or Vercel will read it.

---

## 🧪 Build & Preview

```bash
npm run build      # produce dist/
npm run preview    # preview production build
```

Extend new model capabilities by adding helpers in `services/geminiService.ts` and wiring them up inside `App.tsx`. Let the assistant understand more modalities, add new editing intents, or customize the UI theme to suit your studio workflow.
