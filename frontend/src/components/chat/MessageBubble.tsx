import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  raw_model_response: string;
  timestamp?: string;
}

const MessageBubble = ({ role, content, raw_model_response, timestamp }: MessageBubbleProps) => {
  const isUser = role === 'user';
  const [showRawResponse, setShowRawResponse] = useState(false);

  return (
    <div
      className={cn(
        'flex gap-3 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-user-bubble' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-user-bubble-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-user-bubble text-user-bubble-foreground rounded-tl-sm'
              : 'bg-assistant-bubble text-assistant-bubble-foreground rounded-tr-sm'
          )}
        >
          {content}
        </div>

        {/* زر إظهار raw_model_response إذا كانت الرسالة من assistant */}
        {!isUser && raw_model_response && (
          <button
            className="mt-1 text-xs text-blue-500 hover:underline"
            onClick={() => setShowRawResponse(!showRawResponse)}
          >
            {showRawResponse ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        )}

        {/* عرض raw_model_response */}
        {!isUser && showRawResponse && (
          <div className="mt-1 rounded-lg bg-gray-100 p-2 text-xs text-gray-800 whitespace-pre-wrap">
            {raw_model_response}
          </div>
        )}

        {timestamp && (
          <span className="px-1 text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
