# Gemini Chat App

A modern, responsive chat interface built with Next.js 14 and Google's Gemini AI API. Features real-time streaming responses, dark/light mode, and a beautiful UI using Shadcn components.

## Features

- 💬 Real-time chat with Google's Gemini AI
- 🌓 Dark/Light mode toggle
- 📱 Responsive design for all devices
- ⚡ Streaming responses for instant feedback
- 📋 Message copy functionality
- 💾 Chat history persistence
- 🎨 Modern UI with Shadcn components
- 🔄 Auto-scrolling messages
- ⌨️ Keyboard shortcuts

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Google Generative AI SDK
- Framer Motion
- TanStack Query
- Zod for validation

## Prerequisites

- Node.js 18+ and npm
- Google AI Studio API key

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gemini-chat-app.git
cd gemini-chat-app
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory:

```env
GOOGLE_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
GOOGLE_API_KEY=your_api_key_here
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── route.ts
│   │       └── sessions/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── ChatInterface.tsx
│   ├── ChatSidebar.tsx
│   ├── MessageBubble.tsx
│   └── TypingIndicator.tsx
├── lib/
│   ├── AIService.ts
│   ├── db.ts
│   └── validation.ts
└── types/
    └── chat.ts
```

## API Routes

- `POST /api/chat`: Send a message to Gemini AI
- `GET /api/chat/sessions`: Get all chat sessions
- `POST /api/chat/sessions`: Create a new chat session
- `GET /api/chat/sessions/[id]`: Get a specific chat session
- `PATCH /api/chat/sessions/[id]`: Update a chat session
- `DELETE /api/chat/sessions/[id]`: Delete a chat session

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
