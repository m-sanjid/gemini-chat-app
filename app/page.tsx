import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Gemini Chat App",
  description: "Gemini Chat App ui with Next.js and Tailwind CSS",
  keywords: ["Gemini Chat App", "Next.js", "Tailwind CSS", "Chat Interface"],
  openGraph: {
    title: "Gemini Chat App",
    description: "Gemini Chat App ui with Next.js and Tailwind CSS",
    type: "website",
    locale: "en",
    siteName: "Gemini Chat App",
  },
  twitter: {
    title: "Gemini Chat App",
    description: "Gemini Chat App ui with Next.js and Tailwind CSS",
    card: "summary_large_image",
    site: "@dev_sanjid",
    creator: "@dev_sanjid",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Home() {
  return (
    <div>
      <ChatInterface />
    </div>
  );
}
