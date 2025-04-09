
import React, { useEffect, useRef, useState } from "react";
import { ref, onValue, push, set, update, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, StopCircle, Play, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string | null;
  audioUrl: string | null;
  timestamp: Date;
  isAudio: boolean;
}

interface ChatAreaProps {
  conversationId: string | null;
  otherUser: User | null;
}

const ChatArea = ({ conversationId, otherUser }: ChatAreaProps) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    
    const messagesRef = ref(db, `messages/${conversationId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData: Message[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert object to array and sort by timestamp
        Object.entries(data).forEach(([id, value]) => {
          const message = value as any;
          messagesData.push({
            id,
            senderId: message.senderId,
            text: message.text || null,
            audioUrl: message.audioUrl || null,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            isAudio: !!message.audioUrl
          });
        });
        
        // Sort messages by timestamp
        messagesData.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
      }
      
      setMessages(messagesData);
    });
    
    return () => unsubscribe();
  }, [conversationId]);
  
  const sendTextMessage = async () => {
    if (!messageText.trim() || !conversationId || !currentUser) return;
    
    try {
      const timestamp = new Date().toISOString();
      
      // Add message to database
      const newMessageRef = push(ref(db, `messages/${conversationId}`));
      await set(newMessageRef, {
        senderId: currentUser.uid,
        text: messageText,
        timestamp: timestamp,
      });
      
      // Update conversation's last message
      const conversationRef = ref(db, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessage: messageText,
        lastMessageTime: timestamp
      });
      
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again later.",
      });
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Clean up media stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Microphone access denied",
        description: "Please enable microphone access in browser settings.",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  
  const sendAudioMessage = async () => {
    if (!audioURL || !conversationId || !currentUser) return;
    
    try {
      // Convert audio URL to Blob
      const response = await fetch(audioURL);
      const audioBlob = await response.blob();
      
      // Upload audio to Firebase Storage
      const audioStorageRef = storageRef(storage, `audio/${conversationId}/${Date.now()}.webm`);
      await uploadBytes(audioStorageRef, audioBlob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(audioStorageRef);
      
      const timestamp = new Date().toISOString();
      
      // Add message to database
      const newMessageRef = push(ref(db, `messages/${conversationId}`));
      await set(newMessageRef, {
        senderId: currentUser.uid,
        audioUrl: downloadURL,
        timestamp: timestamp,
      });
      
      // Update conversation's last message
      const conversationRef = ref(db, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessage: "🎤 Audio message",
        lastMessageTime: timestamp,
      });
      
      setAudioURL(null);
    } catch (error) {
      console.error("Error sending audio message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send audio",
        description: "Please try again later.",
      });
    }
  };
  
  const playAudio = (audioUrl: string, messageId: string) => {
    const audio = new Audio(audioUrl);
    
    audio.onplay = () => {
      setIsPlaying(prev => ({ ...prev, [messageId]: true }));
    };
    
    audio.onended = () => {
      setIsPlaying(prev => ({ ...prev, [messageId]: false }));
    };
    
    audio.play();
  };
  
  const stopAudio = (audioUrl: string, messageId: string) => {
    // Find and stop the audio element that's currently playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.src === audioUrl) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    setIsPlaying(prev => ({ ...prev, [messageId]: false }));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const viewProfile = () => {
    setShowUserDialog(true);
  };
  
  if (!conversationId || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-chat-primary bg-opacity-10 rounded-full p-4">
              <MessageSquare className="h-12 w-12 text-chat-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Voice Verse Connect</h2>
          <p className="text-gray-600">
            Select a conversation from the sidebar or start a new chat to begin messaging
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 cursor-pointer" onClick={viewProfile}>
            {otherUser?.photoURL ? (
              <AvatarImage src={otherUser.photoURL} />
            ) : (
              <AvatarFallback className="bg-chat-secondary text-white">
                {getInitials(otherUser.displayName)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium">{otherUser.displayName}</h3>
            <p className="text-xs text-gray-500">{otherUser.email}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={viewProfile}
        >
          <User className="h-4 w-4 mr-1" />
          View Profile
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-chat-bg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.senderId === currentUser?.uid ? "justify-end" : "justify-start"
              }`}
            >
              {message.senderId !== currentUser?.uid && (
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  {otherUser?.photoURL ? (
                    <AvatarImage src={otherUser.photoURL} />
                  ) : (
                    <AvatarFallback className="bg-chat-secondary text-white text-xs">
                      {getInitials(otherUser.displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] ${
                  message.senderId === currentUser?.uid
                    ? "bg-chat-message-sender text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                    : "bg-chat-message-receiver text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                } px-4 py-2 break-words`}
              >
                {message.isAudio ? (
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 p-0 mr-2 ${
                        message.senderId === currentUser?.uid
                          ? "text-white hover:text-white hover:bg-opacity-20 hover:bg-white"
                          : "text-chat-primary hover:text-chat-secondary hover:bg-transparent"
                      }`}
                      onClick={() => {
                        if (isPlaying[message.id]) {
                          stopAudio(message.audioUrl!, message.id);
                        } else {
                          playAudio(message.audioUrl!, message.id);
                        }
                      }}
                    >
                      {isPlaying[message.id] ? (
                        <StopCircle className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                    <span className="text-sm">
                      Audio message
                    </span>
                  </div>
                ) : (
                  <div>{message.text}</div>
                )}
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === currentUser?.uid
                      ? "text-gray-200"
                      : "text-gray-500"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Audio Recording Preview */}
      {audioURL && (
        <div className="px-4 py-2 bg-white border-t flex items-center">
          <div className="flex-1 flex items-center">
            <Play
              className="h-5 w-5 text-chat-primary mr-2 cursor-pointer"
              onClick={() => {
                const audio = new Audio(audioURL);
                audio.play();
              }}
            />
            <div className="text-sm text-gray-600">Audio message ready to send</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={() => setAudioURL(null)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-chat-primary hover:bg-chat-secondary ml-2"
            onClick={sendAudioMessage}
          >
            Send Audio
          </Button>
        </div>
      )}
      
      {/* Input Area */}
      <div className="border-t p-4 bg-white flex items-center">
        <Input
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2"
          disabled={isRecording}
        />
        
        {!isRecording ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mr-2 text-chat-primary hover:text-chat-secondary hover:bg-chat-light"
              onClick={startRecording}
            >
              <Mic className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              className="bg-chat-primary hover:bg-chat-secondary"
              onClick={sendTextMessage}
              disabled={!messageText.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="destructive"
            onClick={stopRecording}
            className="flex items-center"
          >
            <StopCircle className="h-5 w-5 mr-1" />
            <span className="animate-pulse-recording">Recording...</span>
          </Button>
        )}
      </div>
      
      {/* User Profile Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            <Avatar className="h-24 w-24 mb-4">
              {otherUser?.photoURL ? (
                <AvatarImage src={otherUser.photoURL} />
              ) : (
                <AvatarFallback className="bg-chat-secondary text-white text-2xl">
                  {getInitials(otherUser.displayName)}
                </AvatarFallback>
              )}
            </Avatar>
            <h2 className="text-xl font-bold">{otherUser.displayName}</h2>
            <p className="text-gray-500">{otherUser.email}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple message icon component for the empty state
const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
};

export default ChatArea;
