import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, HelpCircle, Star, Bot, User, Sparkles, Zap, ArrowUp, Brain, Cpu, Wand2, MessageCircle, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Faq, Message } from "@shared/schema";

export default function SupportPage() {
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const { data: faqs, isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faq"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chatbot/messages"],
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when typing indicator appears
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsTyping(true);
      
      // Add realistic response delay based on message length
      const baseDelay = 1000; // 1 second base delay
      const lengthDelay = Math.min(message.length * 50, 2000); // Up to 2 seconds for long messages
      const totalDelay = baseDelay + lengthDelay;
      
      // Wait for realistic typing time
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      
      return await apiRequest("POST", "/api/chatbot/send", { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages"] });
      setChatMessage("");
      setIsTyping(false);
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { content: string; rating: number }) => {
      return await apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted",
      });
      setFeedbackText("");
      setFeedbackRating(5);
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/chatbot/messages");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages"] });
      toast({
        title: "History Cleared!",
        description: "Your chat history has been cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessageMutation.mutate(chatMessage);
    }
  };

  const handleSubmitFeedback = () => {
    if (feedbackText.trim()) {
      submitFeedbackMutation.mutate({ content: feedbackText, rating: feedbackRating });
    }
  };

  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    // Send feedback to backend for learning
    apiRequest("POST", "/api/chatbot/feedback", {
      messageId,
      feedback,
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.error('Failed to send feedback:', error);
    });

    // Show user feedback
    toast({
      title: feedback === 'positive' ? "Thank you! 👍" : "Thanks for the feedback! 👎",
      description: feedback === 'positive' ? "We're glad we could help!" : "We'll work on improving that response.",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-full blur-xl"></div>
              <div className="relative p-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-full border border-primary/20">
                <Brain className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2" data-testid="text-support-title">
              SmartShopAI Assistant
          </h1>
            <p className="text-muted-foreground text-lg">
              Your intelligent shopping companion powered by advanced AI
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <Cpu className="h-3 w-3" />
              Neural Network
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-primary/30">
              <Wand2 className="h-3 w-3" />
              Magic AI
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <Zap className="h-3 w-3" />
              Instant Response
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
                  <div className="relative p-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full">
                    <Brain className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-lg font-semibold">SmartShopAI Assistant</span>
                  <p className="text-xs text-muted-foreground">Powered by Advanced Neural Networks</p>
                </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <Badge variant="secondary" className="text-xs">
                            AI Online
                          </Badge>
                          {messages && messages.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearHistory}
                              disabled={clearHistoryMutation.isPending}
                              className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                              title="Clear chat history"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Clear
                            </Button>
                          )}
                        </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages Container */}
                <div 
                  ref={chatContainerRef}
                  className="bg-gradient-to-b from-muted/20 to-background/50 rounded-xl p-4 h-96 overflow-y-auto border border-primary/10"
                >
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-start">
                          <div className="flex items-start gap-3">
                            <div className="relative p-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full">
                              <Brain className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl px-4 py-3 max-w-[70%]">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.slice().reverse().map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                        data-testid={`message-${msg.id}`}
                      >
                          <div className={`flex items-start gap-3 max-w-[85%] ${msg.isBot ? "" : "flex-row-reverse"}`}>
                            {msg.isBot ? (
                              <div className="relative p-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full flex-shrink-0">
                                <Brain className="h-4 w-4 text-primary" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                              </div>
                            ) : (
                              <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex-shrink-0">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-lg ${
                            msg.isBot
                                  ? "bg-gradient-to-br from-card to-muted/30 border border-primary/20"
                                  : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-between mt-2 text-xs ${msg.isBot ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                {msg.isBot && (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                      <Cpu className="h-3 w-3" />
                                      AI
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleFeedback(msg.id, 'positive')}
                                        className="hover:bg-green-500/20 p-1 rounded transition-colors"
                                        title="Good response"
                                      >
                                        <span className="text-green-500 hover:text-green-400">👍</span>
                                      </button>
                                      <button
                                        onClick={() => handleFeedback(msg.id, 'negative')}
                                        className="hover:bg-red-500/20 p-1 rounded transition-colors"
                                        title="Poor response"
                                      >
                                        <span className="text-red-500 hover:text-red-400">👎</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-start gap-3">
                            <div className="relative p-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full">
                              <Brain className="h-4 w-4 text-primary animate-pulse" />
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background animate-pulse"></div>
                            </div>
                            <div className="bg-gradient-to-br from-card to-muted/30 border border-primary/20 rounded-2xl px-4 py-3 shadow-lg">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-xs text-muted-foreground">AI is thinking...</span>
                                <Cpu className="h-3 w-3 text-primary animate-spin" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Scroll anchor */}
                      <div ref={messagesEndRef} />
                      </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-full blur-xl"></div>
                          <div className="relative p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-full border border-primary/20">
                            <Brain className="h-16 w-16 text-primary animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                          Welcome to SmartShopAI!
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          I'm your intelligent shopping companion. Ask me anything about shopping lists, products, orders, or recommendations!
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => setChatMessage("Hello! How are you?")} className="hover:bg-primary/10">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Say Hello
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setChatMessage("How do I create a shopping list?")} className="hover:bg-primary/10">
                            <Wand2 className="h-4 w-4 mr-2" />
                            Create List
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setChatMessage("Show me products")} className="hover:bg-primary/10">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Browse Products
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Chat Input Area */}
                <div className="relative">
                  <div className="relative flex items-center">
                    {/* Brain Icon - Inside input field */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <Brain className="h-4 w-4 text-primary/60" />
                    </div>
                    
                    {/* Input Field */}
                    <Input
                      placeholder="Ask your AI assistant anything..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      data-testid="input-chat-message"
                      className="flex-1 pl-10 pr-12 h-12 border-2 border-primary/20 focus:border-primary/50 transition-all bg-gradient-to-r from-background to-muted/20 rounded-xl"
                      disabled={sendMessageMutation.isPending}
                    />
                    
                    {/* Send Button - Always visible, inside input field */}
                    <Button
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg disabled:opacity-50"
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !chatMessage.trim()}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Input Instructions and Features */}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Press Enter to send
                      </span>
                      <span>•</span>
                      <span>Shift+Enter for new line</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        Neural AI
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Wand2 className="h-3 w-3" />
                        Smart Responses
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                <Star className="h-5 w-5 text-primary" />
                </div>
                <span>Share Your Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">How was your experience?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      data-testid={`button-rating-${star}`}
                    >
                      <Star
                        className={`h-6 w-6 transition-all ${
                          star <= feedbackRating
                            ? "fill-primary text-primary scale-110"
                            : "text-muted-foreground group-hover:text-primary/70"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {feedbackRating === 5 && "Excellent! 🌟"}
                  {feedbackRating === 4 && "Great! 👍"}
                  {feedbackRating === 3 && "Good! 🙂"}
                  {feedbackRating === 2 && "Fair! 😐"}
                  {feedbackRating === 1 && "Poor! 😞"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your Feedback</label>
                <Textarea
                  placeholder="Tell us what you think..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  data-testid="input-feedback-text"
                />
              </div>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submitFeedbackMutation.isPending || !feedbackText.trim()}
                className="w-full"
                data-testid="button-submit-feedback"
              >
                {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <span>Frequently Asked Questions</span>
              <Badge variant="outline" className="ml-auto">
                {faqs?.length || 0} Questions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {faqsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : faqs && faqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`faq-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger 
                      className="text-left hover:no-underline py-4"
                      data-testid={`button-faq-${faq.id}`}
                    >
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <HelpCircle className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No FAQs Yet</h3>
                <p className="text-muted-foreground">Check back soon for helpful answers!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
