
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  otherUser: User | null;
}

interface ChatSidebarProps {
  onSelectConversation: (conversationId: string, otherUser: User) => void;
  onNewChat: () => void;
  onLogout: () => void;
}

const ChatSidebar = ({ onSelectConversation, onNewChat, onLogout }: ChatSidebarProps) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    if (!currentUser) return;

    // Get conversations where current user is a participant
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: Conversation[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Get the other user's ID
        const otherUserId = data.participants.find(
          (uid: string) => uid !== currentUser.uid
        );
        
        // Get other user's data
        let otherUser = null;
        if (otherUserId) {
          const userDocRef = doc(db, "users", otherUserId);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            otherUser = { 
              uid: otherUserId,
              ...userDocSnapshot.data()
            } as User;
          }
        }
        
        conversationsData.push({
          id: docSnapshot.id,
          participants: data.participants,
          lastMessage: data.lastMessage || "Start a conversation",
          lastMessageTime: data.lastMessageTime ? new Date(data.lastMessageTime) : new Date(),
          otherUser
        });
      }
      
      setConversations(conversationsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredConversations = conversations.filter(convo => 
    convo.otherUser && 
    convo.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date >= yesterday) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              {currentUser?.photoURL ? (
                <AvatarImage src={currentUser.photoURL} />
              ) : (
                <AvatarFallback className="bg-chat-primary text-white">
                  {currentUser?.displayName ? getInitials(currentUser.displayName) : "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium">
                {currentUser?.displayName || "User"}
              </h3>
              <p className="text-xs text-gray-500">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut size={20} />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search conversations"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          className="w-full bg-chat-primary hover:bg-chat-secondary"
          onClick={onNewChat}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
      
      <Separator />
      
      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto scrollbar-hide">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new conversation</p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => 
                  conversation.otherUser && 
                  onSelectConversation(conversation.id, conversation.otherUser)
                }
                className="flex items-center p-4 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
                  {conversation.otherUser?.photoURL ? (
                    <AvatarImage src={conversation.otherUser.photoURL} />
                  ) : (
                    <AvatarFallback className="bg-chat-secondary text-white">
                      {conversation.otherUser?.displayName 
                        ? getInitials(conversation.otherUser.displayName) 
                        : "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium truncate">
                      {conversation.otherUser?.displayName || "Unknown User"}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;