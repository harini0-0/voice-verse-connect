
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-chat-bg to-white p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-chat-primary mb-2">Voice Verse Connect</h1>
        <p className="text-lg text-gray-600">Chat with friends through text and voice!</p>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 transition-all duration-300 ease-in-out">
        {showLogin ? (
          <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
