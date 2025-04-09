
import { useState } from "react";
import { ref, get, child, push, set, serverTimestamp } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import NewChatModal from "./NewChatModal";

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

const ChatLayout = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    }
  };
  
  const handleSelectConversation = (conversationId: string, otherUser: User) => {
    setSelectedConversation(conversationId);
    setSelectedUser(otherUser);
  };
  
  const handleNewChat = () => {
    setIsNewChatModalOpen(true);
  };
  
  const handleUserSelect = async (user: User) => {
    if (!currentUser) return;
    
    try {
      // Check if conversation already exists
      const conversationsRef = ref(db, "conversations");
      const conversationsSnapshot = await get(conversationsRef);
      
      let existingConversationId = null;
      
      if (conversationsSnapshot.exists()) {
        const conversations = conversationsSnapshot.val();
        
        // Find conversation where both users are participants
        Object.entries(conversations).forEach(([id, value]) => {
          const convo = value as any;
          if (convo.participants && 
              convo.participants.includes(currentUser.uid) && 
              convo.participants.includes(user.uid)) {
            existingConversationId = id;
          }
        });
      }
      
      if (existingConversationId) {
        // Use existing conversation
        setSelectedConversation(existingConversationId);
      } else {
        // Create new conversation
        const newConversationRef = push(conversationsRef);
        const timestamp = new Date().toISOString();
        
        await set(newConversationRef, {
          participants: [currentUser.uid, user.uid],
          createdAt: timestamp,
          lastMessageTime: timestamp,
        });
        
        setSelectedConversation(newConversationRef.key);
      }
      
      setSelectedUser(user);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create conversation. Please try again.",
      });
    }
  };
  
  return (
    <div className="flex h-screen">
      {/* Sidebar - Takes 1/3 of the screen width on desktop */}
      <div className="hidden md:block w-1/3 max-w-xs">
        <ChatSidebar
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
        />
      </div>
      
      {/* Mobile sidebar toggle would go here */}
      
      {/* Chat Area - Takes remaining space */}
      <div className="flex-1">
        <ChatArea
          conversationId={selectedConversation}
          otherUser={selectedUser}
        />
      </div>
      
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onUserSelect={handleUserSelect}
      />
    </div>
  );
};

export default ChatLayout;
