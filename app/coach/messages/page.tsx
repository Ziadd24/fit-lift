"use client";

import React, { useState, useEffect, useRef } from "react";
import { CoachLayout } from "@/components/layout/CoachLayout";
import {
  useListConversations,
  useListMessages,
  useSendMessage,
  useListMembers,
  useUploadMessageImage,
} from "@/lib/api-hooks";
import { Card, Input, Button } from "@/components/ui/PremiumComponents";
import { MessageCircle, Send, User, Image as ImageIcon, Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MessagesParamsHandler({ onMemberSelected }: { onMemberSelected: (id: number) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const memberId = searchParams.get("memberId");
    if (memberId) {
      onMemberSelected(parseInt(memberId));
    }
  }, [searchParams, onMemberSelected]);

  return null;
}

export default function CoachMessages() {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastImage, setBroadcastImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);

  // Sync mock messages with localStorage for cross-tab communication
  // REMOVED: replaced with Supabase real-time polling via useListMessages

  const { data: conversations } = useListConversations();
  const { data: messages } = useListMessages(selectedMemberId);
  const { data: membersPage } = useListMembers(1, undefined, undefined, undefined, { pageSize: "all" });
  const members = membersPage?.members || [];
  const sendMutation = useSendMessage();
  const uploadImageMutation = useUploadMessageImage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedMemberId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() && !pendingImage) return;
    if (!selectedMemberId) return;

    const imageUrl = pendingImage;
    setPendingImage(null);
    setMessageText("");

    sendMutation.mutate({ 
      memberId: selectedMemberId, 
      content: messageText,
      imageUrl: imageUrl || undefined,
      senderType: "coach"
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMemberId) return;

    setIsUploading(true);
    try {
      const url = await uploadImageMutation.mutateAsync(file);
      setPendingImage(url);
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim() && !broadcastImage) return;
    const targets = members?.length ? members : fallbackList.map(f => ({ id: f.member_id }));
    
    targets.forEach(m => {
      sendMutation.mutate({ 
        memberId: m.id, 
        content: broadcastText,
        imageUrl: broadcastImage || undefined,
        senderType: "coach"
      });
    });

    setBroadcastText("");
    setBroadcastImage(null);
    setIsBroadcastModalOpen(false);
  };

  const handleBroadcastImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageMutation.mutateAsync(file);
      setBroadcastImage(url);
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setIsUploading(false);
      if (broadcastFileInputRef.current) broadcastFileInputRef.current.value = "";
    }
  };

  // Generate conversations list from DB members or fallback
  const fallbackList = [
    { member_id: 1111, member_name: "Ziad", content: "Waiting for connection..." },
    { member_id: 991, member_name: "Ahmed Hassan", content: "Thanks coach, I will try to hit those targets!" },
    { member_id: 992, member_name: "Sarah Ahmed", content: "Can we reschedule tomorrow?" }
  ];

  const displayConversations = members?.length ? members.map(m => {
    const lastConv = conversations?.find(c => c.member_id === m.id);
    return {
      member_id: m.id,
      member_name: m.name,
      content: lastConv?.content || "Click to start chatting..."
    };
  }) : fallbackList;

  const displayMessages = messages || [];

  const selectedMemberName =
    displayConversations.find((c) => c.member_id === selectedMemberId)?.member_name ||
    "Select a client";

  return (
    <CoachLayout>
      <Suspense fallback={null}>
        <MessagesParamsHandler onMemberSelected={setSelectedMemberId} />
      </Suspense>
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-display text-white">Messages</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Communicate directly with your clients.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Inbox Sidebar */}
        <Card className="flex flex-col border-white/5 bg-black/20">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-white text-lg">Conversations</h3>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-2 text-[10px] font-bold border-primary/30 text-primary uppercase tracking-widest hover:bg-primary/10"
              onClick={() => setIsBroadcastModalOpen(true)}
            >
              <Megaphone className="w-3 h-3 mr-1" /> Broadcast
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {displayConversations.map((conv) => (
              <button
                key={conv.member_id}
                onClick={() => setSelectedMemberId(conv.member_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  selectedMemberId === conv.member_id
                    ? "bg-primary/20 border border-primary/50 text-white shadow-lg"
                    : "hover:bg-white/5 border border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{conv.member_name}</p>
                  <p className="text-xs truncate opacity-70">{conv.content}</p>
                </div>
              </button>
            ))}
            {displayConversations.length === 0 && (
              <div className="text-center p-8 text-muted-foreground text-sm">
                No active conversations. When clients message you, they will
                appear here.
              </div>
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col border-white/5 bg-black/20">
          {selectedMemberId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-white text-lg">
                  {selectedMemberName}
                </h3>
              </div>

              {/* Messages View */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {displayMessages.map((msg) => {
                    const isCoach = msg.sender_type === "coach";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          isCoach ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                            isCoach
                              ? "bg-primary text-primary-foreground rounded-tr-sm box-glow"
                              : "bg-white/10 text-white rounded-tl-sm border border-white/5"
                          }`}
                        >
                          {msg.image_url && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-h-60">
                              <img src={msg.image_url} alt="Uploaded content" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {msg.content && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                          <p
                            className={`text-[10px] mt-2 text-right ${
                              isCoach
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/5 bg-black/40">
                {/* Pending Image Preview */}
                {pendingImage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 relative rounded-xl overflow-hidden border border-primary/30 h-24 w-24"
                  >
                    <img src={pendingImage} className="w-full h-full object-cover" alt="Pending upload" />
                    <button 
                      onClick={() => setPendingImage(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
                <form onSubmit={(e) => handleSend(e)} className="flex gap-3">
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 w-11 h-11 p-0 border-white/10 text-muted-foreground hover:text-primary hover:border-primary/50 disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || uploadImageMutation.isPending}
                  >
                    {isUploading ? (
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={pendingImage ? "Add a caption (optional)..." : "Type a message..."}
                    className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    disabled={isUploading}
                  />
                  <Button
                    type="submit"
                    disabled={(!messageText.trim() && !pendingImage) || sendMutation.isPending || isUploading}
                    className="shrink-0 px-5"
                  >
                    {sendMutation.isPending ? (
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p>Select a client from the sidebar to view your conversation.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsBroadcastModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg"
            >
              <Card className="p-8 border-primary/20 shadow-[0_0_50px_rgba(62,182,76,0.1)]">
                <button 
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/20 rounded-2xl text-primary">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display text-white">Send Broadcast</h2>
                    <p className="text-sm text-muted-foreground">Message will be sent to ALL active clients.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Your Message</label>
                       <button 
                        onClick={() => broadcastFileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                       >
                         <ImageIcon className="w-3 h-3" /> Add Image
                       </button>
                    </div>
                    <input 
                      type="file" 
                      hidden 
                      ref={broadcastFileInputRef} 
                      accept="image/*" 
                      onChange={handleBroadcastImageUpload}
                    />
                    
                    {broadcastImage && (
                      <div className="relative mb-3 rounded-lg overflow-hidden border border-primary/30 h-32 bg-black/40">
                         <img src={broadcastImage} className="w-full h-full object-contain" alt="Broadcast preview" />
                         <button 
                          onClick={() => setBroadcastImage(null)}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                         >
                           <X className="w-3 h-3" />
                         </button>
                      </div>
                    )}

                    <textarea
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="Type your announcement here..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsBroadcastModalOpen(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleBroadcast} disabled={!broadcastText.trim() && !broadcastImage}>
                      Send to all clients
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CoachLayout>
  );
}
