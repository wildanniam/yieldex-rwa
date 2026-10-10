'use client';

// Adapted from Rafi's full-page chat composition in PR #18. CopilotKit v2 owns
// streaming/state; the shared, validated tool cards own all financial content.
import { useEffect, useRef, type ComponentProps } from 'react';
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
  type CopilotChatAssistantMessageProps,
  type CopilotChatUserMessageProps,
} from '@copilotkit/react-core/v2';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import s from './chat.module.css';

function AssistantBubble(props: CopilotChatAssistantMessageProps) {
  return (
    <div className={s.assistantRow}>
      <span className={s.avatar} aria-hidden="true">
        <Icon name="sparkles" inheritColor size={17} />
      </span>
      <CopilotChatAssistantMessage
        {...props}
        className={s.assistantMessage}
        toolbarVisible={false}
      >
        {({ markdownRenderer, toolCallsView }) => (
          <div>
            {markdownRenderer}
            {toolCallsView}
          </div>
        )}
      </CopilotChatAssistantMessage>
    </div>
  );
}
function UserBubble(props: CopilotChatUserMessageProps) {
  return (
    <CopilotChatUserMessage {...props} className={s.userMessage}>
      {({ messageRenderer }) => (
        <div className={s.userBubble}>{messageRenderer}</div>
      )}
    </CopilotChatUserMessage>
  );
}

const AssistantMessageSlot = Object.assign(
  AssistantBubble,
  CopilotChatAssistantMessage,
);
const UserMessageSlot = Object.assign(UserBubble, CopilotChatUserMessage);

type ChatViewProps = ComponentProps<typeof CopilotChat.View>;
export function ConversationView(
  props: ChatViewProps & {
    onRunningChange?: (running: boolean) => void;
    onClearError?: () => void;
    blocked?: boolean;
  },
) {
  const { onRunningChange, onClearError, blocked, ...view } = props;
  const submitting = useRef(false);
  const value = props.inputValue ?? '';
  useEffect(() => {
    onRunningChange?.(!!props.isRunning);
  }, [props.isRunning, onRunningChange]);
  useEffect(() => {
    if (!value) submitting.current = false;
  }, [value]);
  const submit = () => {
    if (
      !value.trim() ||
      props.isRunning ||
      props.isConnecting ||
      blocked ||
      submitting.current ||
      !props.onSubmitMessage
    )
      return;
    submitting.current = true;
    onClearError?.();
    props.onSubmitMessage(value.trim());
  };
  const empty = !props.messages?.length;
  return (
    <CopilotChat.View
      {...view}
      welcomeScreen={false}
      autoScroll="pin-to-bottom"
      messageView={{
        assistantMessage: AssistantMessageSlot,
        userMessage: UserMessageSlot,
      }}
    >
      {({ scrollView }) => (
        <div
          className={s.conversation}
          data-assistant-running={props.isRunning ? 'true' : 'false'}
        >
          {empty && !props.isConnecting ? (
            <div className={s.welcome}>
              <span className={s.welcomeMark} aria-hidden="true">
                <Icon name="sparkles" inheritColor size={29} />
              </span>
              <h2>Ada yang ingin kamu pahami?</h2>
              <p>
                Cari hak pendapatan, pahami aset, atau bandingkan quote. Jawaban
                memakai data platform dan sumber harga yang tersedia.
              </p>
              <div className={s.suggestions}>
                {[
                  'Tampilkan penawaran yang tersedia',
                  'Jelaskan risiko hak pendapatan',
                  'Bandingkan 1 ETH ke USDC di Ethereum dan Base',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={props.isConnecting || blocked}
                    onClick={() => props.onInputChange?.(prompt)}
                  >
                    {prompt}
                    <Icon name="arrow-up-right" size={14} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={s.messageViewport}>{scrollView}</div>
          )}
          {props.isConnecting && (
            <p role="status" className={s.connectionStatus}>
              Menghubungkan percakapan…
            </p>
          )}
          <form
            className={s.composer}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className={s.srOnly} htmlFor="yieldex-chat-message">
              Pesan untuk Yieldex Assistant
            </label>
            <textarea
              id="yieldex-chat-message"
              value={value}
              rows={2}
              maxLength={8000}
              placeholder="Tanyakan sesuatu tentang Yieldex…"
              disabled={!!blocked || !!props.isConnecting}
              onChange={(event) => props.onInputChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <div className={s.composerBottom}>
              <span>
                {props.isRunning
                  ? 'Menyusun jawaban…'
                  : 'Enter untuk kirim · Shift + Enter untuk baris baru'}
              </span>
              {props.isRunning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={props.onStop}
                  aria-label="Hentikan jawaban"
                >
                  Hentikan
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={
                    !value.trim() ||
                    !!props.isConnecting ||
                    !!blocked ||
                    !props.onSubmitMessage
                  }
                  aria-label="Kirim pesan"
                >
                  <Icon name="arrow-right" inheritColor alt="" size={18} />
                </Button>
              )}
            </div>
          </form>
          <p className={s.disclaimer}>
            AI membantu menjelaskan. Keputusan dan persetujuan transaksi tetap
            di wallet kamu.
          </p>
        </div>
      )}
    </CopilotChat.View>
  );
}
