
import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";
import ChatLayout from "@/components/chat/ChatLayout";

const Index = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chat-primary"></div>
      </div>
    );
  }

  return currentUser ? <ChatLayout /> : <AuthPage />;
};

export default Index;
