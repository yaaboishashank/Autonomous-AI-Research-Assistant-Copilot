# Autonomous AI Research Assistant Copilot

An AI-powered conversational search and knowledge engine. Ask a question in plain language and a LangChain agent decides when to pull live results from the internet before answering, so answers can include current information instead of only what the model was trained on.

This repository holds the backend API and real-time server. A separate frontend client connects to it (default CORS origin: `http://localhost:5173`).

## Features

- Conversational search agent built with LangChain and Mistral. The agent answers from its own knowledge and calls a web search tool when a question needs up-to-date information.
- Live internet search through Tavily, returning the top 5 results per query, exposed to the agent as a tool.
- User accounts with email verification: register, confirm the address through a verification mail, then log in with a JWT session cookie.
- Chat history per user: send messages, list past conversations, fetch the messages of one chat, delete a chat.
- Automatic chat titles: a short 2-4 word title generated from the first message of each conversation.
- Real-time layer with Socket.io attached to the same HTTP server.
- Password hashing with bcryptjs and request validation with express-validator and zod.

## Tech stack

- Node.js and Express 5
- MongoDB with Mongoose
- LangChain (`@langchain/mistralai`) with a Tavily search tool
- Socket.io
- jsonwebtoken (JWT in an httpOnly cookie) and bcryptjs
- Nodemailer with Gmail OAuth2 for verification mail

## Project structure

```text
Backend/
  server.js                 Entry point: HTTP server, MongoDB connection, Socket.io setup
  src/
    app.js                  Express app, middleware, routes, error handler
    config/database.js      Mongoose connection
    controllers/            auth.controller.js, chat.controller.js
    middleware/             auth.middleware.js (JWT session check)
    models/                 user.model.js, chat.model.js, message.model.js
    routes/                 auth.routes.js, chat.routes.js
    services/               ai.service.js, internet.service.js, mail.service.js
    sockets/                server.socket.js
    validators/             auth.validator.js
```

## API reference

Auth routes:

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/api/auth/register` | Public | Register with username, email and password |
| POST | `/api/auth/login` | Public | Log in and set the JWT session cookie |
| GET | `/api/auth/get-me` | Private | Get the current logged-in user |
| GET | `/api/auth/verify-email?token=...` | Public | Verify an email address |

Chat routes (all require a logged-in user):

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/chats/message` | Send a message and get the agent reply |
| GET | `/api/chats` | List the chats of the user |
| GET | `/api/chats/:chatId/messages` | Get the messages of one chat |
| DELETE | `/api/chats/delete/:chatId` | Delete a chat |

`GET /` is a simple health check.

## How the agent works

Every user message goes to a LangChain agent with a system prompt that tells it to answer precisely and to say when it does not know something. If a question needs current information, the agent calls the `searchInternet` tool, which queries Tavily for the top 5 results, and then writes the final answer based on those results. When a conversation starts, a separate call generates a short title from its first message.

## Getting started

Prerequisites:

- Node.js 18 or newer
- A MongoDB connection string
- A Mistral API key and a Tavily API key
- A Google OAuth2 client (Gmail) for sending verification mail

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/yaaboishashank/Autonomous-AI-Research-Assistant-Copilot.git
cd Autonomous-AI-Research-Assistant-Copilot/Backend
npm install
```

2. Create a `.env` file in the `Backend` folder:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
MISTRAL_API_KEY=your_mistral_api_key
TAVILY_API_KEY=your_tavily_api_key
GOOGLE_USER=your_gmail_address
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_google_oauth_refresh_token
FRONTEND_URL=http://localhost:5173
```

3. Start the server:

```bash
npm run dev   # development, auto-restarts on file changes
npm start     # production
```

The API listens on `PORT` (3000 by default) and `GET /` returns a health check message.

License: ISC (as declared in `Backend/package.json`).
