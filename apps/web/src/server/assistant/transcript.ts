import { createHash } from 'node:crypto';
import type { AssistantCard } from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import type { AssistantMessage } from './state';
/** Collect only protocol message events, never raw provider/debug payloads. */
export class Transcript {
  messages: AssistantMessage[];
  constructor(initial: AssistantMessage[]) {
    this.messages = structuredClone(initial);
  }
  accept(event: Record<string, unknown>) {
    if (
      event.type === 'TEXT_MESSAGE_START' &&
      typeof event.messageId === 'string'
    ) {
      if (!this.messages.some((m) => m.id === event.messageId))
        this.messages.push({
          id: event.messageId,
          role: 'assistant',
          content: '',
        });
    }
    if (
      event.type === 'TEXT_MESSAGE_CONTENT' &&
      typeof event.messageId === 'string' &&
      typeof event.delta === 'string'
    ) {
      const m = this.messages.find((m) => m.id === event.messageId);
      if (m?.role === 'assistant') m.content = (m.content ?? '') + event.delta;
    }
    if (
      event.type === 'TOOL_CALL_START' &&
      typeof event.toolCallId === 'string' &&
      typeof event.toolCallName === 'string'
    ) {
      const id =
        typeof event.parentMessageId === 'string'
          ? event.parentMessageId
          : `tools-${event.toolCallId}`;
      let m = this.messages.find((m) => m.id === id);
      if (!m) {
        m = { id, role: 'assistant', content: '' };
        this.messages.push(m);
      }
      if (
        m.role === 'assistant' &&
        !m.toolCalls?.some((t) => t.id === event.toolCallId)
      ) {
        m.toolCalls ??= [];
        m.toolCalls.push({
          id: event.toolCallId,
          type: 'function',
          function: { name: event.toolCallName, arguments: '' },
        });
      }
    }
    if (event.type === 'TOOL_CALL_ARGS' && typeof event.delta === 'string') {
      for (const m of this.messages)
        if (m.role === 'assistant') {
          const t = m.toolCalls?.find((t) => t.id === event.toolCallId);
          if (t) t.function.arguments += event.delta;
        }
    }
    if (
      event.type === 'TOOL_CALL_RESULT' &&
      typeof event.toolCallId === 'string'
    ) {
      const content =
        typeof event.content === 'string'
          ? event.content
          : JSON.stringify(event.content ?? null);
      if (
        !this.messages.some(
          (m) => m.role === 'tool' && m.toolCallId === event.toolCallId,
        )
      )
        this.messages.push({
          id:
            typeof event.messageId === 'string'
              ? event.messageId
              : `result-${event.toolCallId}`,
          role: 'tool',
          toolCallId: event.toolCallId,
          content,
        });
    }
  }
  snapshot() {
    const results = new Set(
      this.messages.filter((m) => m.role === 'tool').map((m) => m.toolCallId),
    );
    const calls = new Set<string>();
    const messages: AssistantMessage[] = [];
    for (const m of this.messages) {
      if (m.role === 'assistant') {
        const copy = { ...m };
        const toolCalls = m.toolCalls?.filter((t) => results.has(t.id));
        toolCalls?.forEach((t) => calls.add(t.id));
        if (!m.content && !toolCalls?.length) continue;
        if (toolCalls?.length) copy.toolCalls = toolCalls;
        else delete copy.toolCalls;
        messages.push(copy);
      } else messages.push(m);
    }
    return messages.filter((m) => m.role !== 'tool' || calls.has(m.toolCallId));
  }
}
export function messageKey(threadId: string, id: string) {
  const hex = createHash('sha256').update(`${threadId}:${id}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export function historyResult(
  threadId: string,
  messages: AssistantMessage[],
  start: number,
) {
  const response = messages.slice(start);
  const cards: AssistantCard[] = [];
  for (const message of response) {
    if (message.role !== 'tool') continue;
    try {
      if (typeof message.content !== 'string') continue;
      const raw = JSON.parse(message.content);
      const parsed = validateData('api.AssistantCard', {
        cardId: `${threadId}:${message.toolCallId}:${raw.kind}`,
        toolCallId: message.toolCallId,
        kind: raw.kind,
        payload: raw.payload,
      });
      if (parsed.success && cards.length < 20) cards.push(parsed.data);
    } catch {
      /* Failed/partial tools are never saved as validated cards. */
    }
  }
  const text = response
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content ?? '')
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 16000);
  return { text, cards };
}
