import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import NewChatModal from "./NewChatModal";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

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
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      let existingConversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(user.uid);
      });
      
      if (existingConversation) {
        // Use existing conversation
        setSelectedConversation(existingConversation.id);
      } else {
        // Create new conversation
        const newConversation = await addDoc(conversationsRef, {
          participants: [currentUser.uid, user.uid],
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: ""
        });
        
        setSelectedConversation(newConversation.id);
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