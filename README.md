# AI Code Debugger

A small React and Express app that uses two AI roles to explain a code issue and suggest a corrected version. It supports Python, C, C++, Java, and JavaScript as **analysis languages**.

> The app does not compile or run submitted code. AI suggestions are not execution or test results.

## How It Works

```text
React dashboard
      |
      v
Express API ---- MongoDB Atlas (users and saved reviews)
      |
      +---- Debugger AI: structured diagnosis
      |
      +---- Fixer AI: corrected code and short explanation
```

The selected language, code, and optional error message are passed to both AI roles. The result is saved to the signed-in user's history. Neither the Node server nor the browser executes submitted code.

## Run Locally

Requirements: Node.js 18+, npm, and MongoDB. For local development, the sample config uses `mongodb://127.0.0.1:27017/ai-debugger-agent`; for hosted deployment, use MongoDB Atlas.

1. Start your local MongoDB service, or create a MongoDB Atlas database and allow your development IP address in its network-access settings.
2. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI` to the database you chose and set `JWT_SECRET` and `LLM_API_KEY`.
3. Copy `client/.env.example` to `client/.env`.
4. Install and start the backend:

   ```powershell
   cd server
   npm.cmd install
   npm.cmd run dev
   ```

5. In another terminal, install and start the frontend:

   ```powershell
   cd client
   npm.cmd install
   npm.cmd run dev
   ```

6. Open `http://localhost:3000`, register, and sign in.

Set `LLM_BASE_URL` and `LLM_MODEL` in `server/.env` to select an OpenAI-compatible provider. The default Groq model is `openai/gpt-oss-120b`. Existing `GROQ_API_KEY` / `GROQ_MODEL` settings also work for Groq. Never commit API keys, JWT secrets, or a MongoDB URI containing credentials.

## Deploy Simply

Use MongoDB Atlas for the database and Render for the backend/frontend. The repository includes a Render Blueprint (`render.yaml`) for both services, and it does not install or require Docker, a Python service, compilers, or a code-execution host.

1. Create a MongoDB Atlas cluster/database and a database user. In Atlas Network Access, allow your development IP during setup; for Render, use its documented outbound IP ranges or temporarily allow `0.0.0.0/0` with a strong database password, then restrict access when possible.
2. Open Render's **New → Blueprint** and select the GitHub repository `tusharpatel19/aidebugger` and branch `codex/update-aidebugger`.
3. During setup, enter the MongoDB Atlas URI for `MONGODB_URI` and your AI provider key for `LLM_API_KEY`. Render generates the `JWT_SECRET`; model and provider URL have defaults in `render.yaml`.
4. Create both services. The static site gets the backend hostname automatically; its API client adds HTTPS and `/api`.
5. After Render assigns the frontend URL, update `CORS_ORIGIN` on `aidebugger-api` to that exact URL (for example `https://aidebugger-web.onrender.com`) and redeploy the backend. The initial wildcard only permits the first deploy to complete before the static-site URL is known.
6. Wait for both deployments to report **Live**. Test the API service root URL (it should return a JSON running message), then open the static-site URL, register, sign in, and submit a small code sample. The free backend plan may sleep when idle and take longer on its first request.

If configuring services manually instead of using the Blueprint: backend root `server`, build `npm ci`, start `npm start`; frontend root `client`, build `npm ci && npm run build`, publish directory `dist`. Set frontend `VITE_API_URL` to the backend URL ending in `/api`.

Environment variables:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Backend | MongoDB Atlas connection |
| `JWT_SECRET` | Backend | Signs login tokens; use a long random value |
| `LLM_API_KEY` | Backend | Secret key for the selected AI provider |
| `LLM_BASE_URL` | Backend | OpenAI-compatible API base URL |
| `LLM_MODEL` | Backend | Provider model name |
| `CORS_ORIGIN` | Backend | Allowed frontend origin |
| `VITE_API_URL` | Frontend build | Backend API URL ending in `/api` |

## API

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me                 JWT protected
POST /api/debug                   JWT protected
GET  /api/debug/history           JWT protected, owner only
GET  /api/debug/:id               JWT protected, owner only
```

`POST /api/debug` accepts `language`, `sourceCode`, and optional `error`. It returns a diagnosis, suggested code, concise agent events, and a saved session ID.

## Tests

```powershell
cd server
npm.cmd test
cd ..\client
npm.cmd run build
```
