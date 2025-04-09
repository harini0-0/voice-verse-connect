
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: User) => void;
}

const NewChatModal = ({ isOpen, onClose, onUserSelect }: NewChatModalProps) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return;
    
    setLoading(true);
    try {
      // Search for users by display name or email
      const usersRef = collection(db, "users");
      const nameQuery = query(
        usersRef, 
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff")
      );
      const emailQuery = query(
        usersRef,
        where("email", ">=", searchQuery),
        where("email", "<=", searchQuery + "\uf8ff")
      );
      
      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);
      
      const users = new Map<string, User>();
      
      // Add users from name search
      nameSnapshot.forEach(doc => {
        const data = doc.data() as User;
        if (data.uid !== currentUser.uid) {
          users.set(data.uid, data);
        }
      });
      
      // Add users from email search
      emailSnapshot.forEach(doc => {
        const data = doc.data() as User;
        if (data.uid !== currentUser.uid) {
          users.set(data.uid, data);
        }
      });
      
      setSearchResults(Array.from(users.values()));
    } catch (error) {
      console.error("Error searching for users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or email"
            className="pl-9 mb-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            className="mt-2 w-full bg-chat-primary hover:bg-chat-secondary"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        
        <div className="mt-4 max-h-64 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {searchQuery ? "No users found" : "Search for users to start a conversation"}
            </div>
          ) : (
            <div>
              {searchResults.map(user => (
                <div
                  key={user.uid}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => onUserSelect(user)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} />
                    ) : (
                      <AvatarFallback className="bg-chat-secondary text-white">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
