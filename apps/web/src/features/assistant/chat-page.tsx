'use client';
import { useAssistant } from '@/components/ChatbotWrapper';
import s from './chat.module.css';
export function ChatPage() {
  const { mountPage } = useAssistant();
  return <div ref={mountPage} className={s.pageHost} />;
}
