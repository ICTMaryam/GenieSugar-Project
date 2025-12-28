import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import type { User as UserType, ChatMessage } from "@shared/schema";

interface Conversation {
  partnerId: string;
  partner: UserType;
  lastMessage: ChatMessage;
}

export default function Chat() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [selectedPartner, setSelectedPartner] = useState<UserType | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
  });

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", selectedPartner?.id],
    enabled: !!selectedPartner,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedPartner) return;
      const response = await apiRequest("POST", `/api/chat/${selectedPartner.id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedPartner) return;
    const interval = setInterval(() => {
      refetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedPartner, refetchMessages]);

  const handleSend = () => {
    if (!messageInput.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout title={t("chat")}>
    <div className="flex h-[calc(100vh-10rem)]" dir={dir}>
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg" data-testid="text-chat-title">{t("messages")}</h2>
        </div>
        
        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedPartner(conv.partner)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 hover-elevate transition-colors ${
                    selectedPartner?.id === conv.partnerId ? "bg-accent" : ""
                  }`}
                  data-testid={`button-conversation-${conv.partnerId}`}
                >
                  <Avatar className="h-10 w-10">
                    {conv.partner.profileImage ? (
                      <AvatarImage src={conv.partner.profileImage} alt={conv.partner.fullName} />
                    ) : null}
                    <AvatarFallback>{getInitials(conv.partner.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{conv.partner.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.content}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noMessages")}</p>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedPartner ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {selectedPartner.profileImage ? (
                  <AvatarImage src={selectedPartner.profileImage} alt={selectedPartner.fullName} />
                ) : null}
                <AvatarFallback>{getInitials(selectedPartner.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="text-chat-partner-name">{selectedPartner.fullName}</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedPartner.role}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <Skeleton className="h-12 w-48 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                          data-testid={`message-${msg.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {msg.createdAt && format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t("startConversation")}</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeMessage")}
                  className="flex-1"
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t("startConversation")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
