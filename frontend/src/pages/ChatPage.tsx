import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatsApi, uploadsApi, type Chat, type Message } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const ChatPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const chatList = await chatsApi.getAll();
        setChats(chatList);
        
        // Select the most recent chat if available
        if (chatList.length > 0) {
          const mostRecent = chatList[0];
          setCurrentChatId(mostRecent.id);
          const chatDetails = await chatsApi.getById(mostRecent.id);
          setMessages(chatDetails.messages || []);
        }
      } catch (error) {
        // For demo purposes, use mock data if API fails
        console.log('Using demo mode - API not connected', error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      loadChats();
    }
  }, [isLoggedIn]);

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setMobileSidebarOpen(false);

    try {
      const chat = await chatsApi.getById(chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      // Demo mode - show empty messages
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await chatsApi.create(`محادثة ${new Date().toLocaleDateString('ar-EG')}`);
      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
      setMobileSidebarOpen(false);
    } catch (error) {
      // Demo mode - create local chat
      const demoChat: Chat = {
        id: `demo-${Date.now()}`,
        title: 'محادثة جديدة',
        updated_at: new Date().toISOString(),
      };
      setChats((prev) => [demoChat, ...prev]);
      setCurrentChatId(demoChat.id);
      setMessages([]);
      setMobileSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatsApi.delete(chatId);
    } catch {
      // Continue with local deletion even if API fails
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      if (remainingChats.length > 0) {
        handleSelectChat(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }

    toast({
      title: 'تم حذف المحادثة',
      description: 'تمت إزالة المحادثة.',
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChatId) {
      // Create a new chat first
      await handleNewChat();
    }

    const chatId = currentChatId || chats[0]?.id;
    if (!chatId) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatsApi.sendMessage(chatId, text);
      // console.log(response)
      // const last_response = response[response.length-1]
      setMessages((prev) => [...prev, response[0]]);
    } catch (error) {
      // Demo mode - simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const demoResponse: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: getDemoResponse(text),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, demoResponse]);
    } finally {
      setIsTyping(false);
    }

    // Update chat title if it's the first message
    const chat = chats.find((c) => c.id === chatId);
    if (chat && (chat.title === 'محادثة جديدة' || chat.title === 'New Chat')) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, title: text.slice(0, 30) + (text.length > 30 ? '...' : '') }
            : c
        )
      );
    }
  };

  const handleUploadPrescription = async (file: File) => {
    toast({
      title: 'جاري رفع الوصفة...',
      description: file.name,
    });

    try {
      await uploadsApi.uploadPrescription(file);
      toast({
        title: 'تم رفع الوصفة',
        description: 'تم حفظ الوصفة الطبية بنجاح.',
      });
    } catch (error) {
      toast({
        title: 'تم الرفع',
        description: 'تم حفظ الوصفة (الوضع التجريبي).',
      });
    }
  };

  const handleUploadTestResult = async (file: File) => {
    toast({
      title: 'جاري رفع نتيجة الفحص...',
      description: file.name,
    });

    try {
      await uploadsApi.uploadTestResult(file);
      toast({
        title: 'تم رفع النتيجة',
        description: 'تم حفظ نتيجة الفحص بنجاح.',
      });
    } catch (error) {
      toast({
        title: 'تم الرفع',
        description: 'تم حفظ النتيجة (الوضع التجريبي).',
      });
    }
  };

  // Demo response generator
  const getDemoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('صداع') || lowerMessage.includes('رأس')) {
      return "أفهم أنك تعاني من صداع. لتقييم حالتك بشكل أفضل، هل يمكنك إخباري:\n\n1. منذ متى وأنت تعاني من هذا الصداع؟\n2. أين يتركز الألم بالضبط (أمام، جوانب، خلف الرأس)؟\n3. كيف تقيم شدة الألم من 1 إلى 10؟\n4. هل لديك أعراض أخرى مثل الغثيان، الحساسية للضوء، أو الحمى؟\n\nهذه المعلومات ستساعدني في تقديم إرشادات أكثر دقة.";
    }
    
    if (lowerMessage.includes('حمى') || lowerMessage.includes('حرارة') || lowerMessage.includes('سخونة')) {
      return "الحمى يمكن أن تشير إلى أن جسمك يحارب عدوى. إليك بعض الأسئلة لتقييم حالتك:\n\n1. ما هي درجة حرارتك الحالية؟\n2. منذ متى لديك هذه الحمى؟\n3. هل لديك أعراض أخرى (سعال، آلام في الجسم، التهاب الحلق)؟\n4. هل كنت على اتصال بشخص مريض؟\n\nفي هذه الأثناء، حافظ على شرب السوائل والراحة. إذا كانت الحرارة أعلى من 39.4 درجة أو استمرت لأكثر من 3 أيام، يرجى مراجعة الطبيب.";
    }
    
    if (lowerMessage.includes('سعال') || lowerMessage.includes('كحة') || lowerMessage.includes('برد') || lowerMessage.includes('زكام')) {
      return "أنا آسف لسماع أنك تعاني من السعال. دعني أجمع المزيد من المعلومات:\n\n1. هل هو سعال جاف أم مع بلغم؟\n2. منذ متى لديك هذا السعال؟\n3. هل لديك أعراض أخرى مثل الحمى، ألم الصدر، أو ضيق التنفس؟\n4. هل لديك تاريخ من الربو أو الحساسية؟\n\nبناءً على إجاباتك، سأتمكن من تقديم توصيات أكثر ملاءمة.";
    }
    
    return "شكراً لمشاركتي ذلك. لتقديم أفضل إرشادات، هل يمكنك وصف أعراضك بمزيد من التفصيل؟ يرجى تضمين:\n\n• متى بدأت الأعراض\n• شدتها من 1 إلى 10\n• أي أعراض أخرى مصاحبة\n• أي أدوية تتناولها حالياً\n\nهذا سيساعدني في تقديم رؤى صحية أكثر دقة.";
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ChatSidebar
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed bottom-20 right-4 z-50 shadow-lg md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <ChatSidebar
              chats={chats}
              currentChatId={currentChatId}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </SheetContent>
        </Sheet>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">جاري تحميل محادثاتك...</p>
              </div>
            </div>
          ) : (
            <>
              <ChatWindow messages={messages} isTyping={isTyping} />
              <ChatInput
                onSend={handleSendMessage}
                onUploadPrescription={handleUploadPrescription}
                onUploadTestResult={handleUploadTestResult}
                disabled={isTyping}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
