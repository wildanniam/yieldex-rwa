import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant | Yieldex',
  description: 'Chat with Yieldex AI Assistant.',
};

import { ChatClient } from './ChatClient';

export default function ChatPage() {
  return <ChatClient />;
}
