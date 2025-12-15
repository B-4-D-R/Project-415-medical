import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Heart, Stethoscope, Shield } from 'lucide-react';
import type { Message } from '@/api/client';

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
}

const ChatWindow = ({ messages, isTyping = false }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero shadow-glow">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-foreground">
            كيف يمكنني مساعدتك اليوم؟
          </h2>
          <p className="mb-8 text-muted-foreground">
            صف أعراضك، اطرح أسئلة صحية، أو ارفع مستندات طبية للحصول على
            إرشادات مخصصة.
          </p>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'لدي صداع وحمى',
              'ما أسباب ألم الصدر؟',
              'اشرح نتائج فحص الدم',
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex justify-center gap-8 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>خاص وآمن</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.sender}
            content={message.text}
            raw_model_response={message.raw_model_response}
            timestamp={message.created_at}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
