import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Client, Message } from "../types/types";

const AgentDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<Client[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>(
    {}
  );
  const [inputText, setInputText] = useState<string>("");
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  // Effect to initialize socket connection and handle events
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    // Handle user connection event
    newSocket.on("user-connected", (user: Client) => {
      setUsers((prev) => {
        if (!prev.find((u) => u.clientId === user.clientId)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    // Handle new user message event
    newSocket.on("new-user-message", ({ message }: { message: Message }) => {
      setMessagesByUser((prev) => ({
        ...prev,
        [message.clientId]: [...(prev[message.clientId] || []), message],
      }));
      
      if (message.clientId !== selectedUser) {
        setUnreadMessages((prev) => ({
          ...prev,
          [message.clientId]: (prev[message.clientId] || 0) + 1,
        }));
      }
    });

    // Handle message event
    newSocket.on("message", (message: Message) => {
      setMessagesByUser((prev) => ({
        ...prev,
        [message.clientId]: [...(prev[message.clientId] || []), message],
      }));
    });

    // Register agent
    newSocket.emit("register-agent");

    return () => {
      newSocket.disconnect();
    };
  }, [selectedUser]);

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (socket && selectedUser && inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        clientId: selectedUser,
        text: inputText.trim(),
        isFromAgent: true,
        timestamp: new Date(),
      };
      
      socket.emit("agent-message", {
        clientId: selectedUser,
        text: inputText.trim(),
      });
      
      setMessagesByUser((prev) => ({
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), newMessage],
      }));
      
      setInputText("");
    }
  };

  // Function to handle key press event for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to receive messages for a selected user
  const receiveMessages = (clientId: string) => {
    if (socket) {
      setSelectedUser(clientId);
      
      // Only fetch messages if we don't have them already
      if (!messagesByUser[clientId]) {
        socket.emit("get-client-conversations", { clientId }, (data: any) => {
          setMessagesByUser((prev) => ({
            ...prev,
            [clientId]: data.data.messages || [],
          }));
        });
      }
      
      // Clear unread messages for this user
      setUnreadMessages((prev) => ({ ...prev, [clientId]: 0 }));
    }
  };

  const currentMessages = selectedUser ? messagesByUser[selectedUser] || [] : [];

  return (
    <div
      className="flex h-screen min-w-lg w-screen w-[100%] bg-[#F0F0F0] overflow-hidden"
      dir="rtl"
    >
      {/* Sidebar */}
      <div className="max-w-64 w-64 bg-white border-l border-[#DBDBDB] h-screen">
        <div className="p-4 border-b border-[#DBDBDB] max-w-64 w-64">
          <text className="text-[20px] font-bold">لیست کاربران</text>
        </div>
        <div className="overflow-y-auto h-full">
          {users.map((user) => (
            <div
              key={user.clientId}
              onClick={() => receiveMessages(user.clientId)}
              className={`p-4 border-b border-[#DBDBDB] cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors ${
                selectedUser === user.clientId ? "bg-purple-50" : ""
              }`}
            >
              <div>
                <span className="text-gray-400 ml-2">کاربر:</span>
                <span className="text-gray-700 text-sm">{user.clientId}</span>
              </div>
              {unreadMessages[user.clientId] > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreadMessages[user.clientId]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-[85%]">
        {selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.isFromAgent ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[70%] break-words whitespace-pre-wrap p-3 rounded-lg ${
                      msg.isFromAgent
                        ? "bg-white text-gray-800 rounded-br-none shadow-sm"
                        : "bg-[#841474] rounded-bl-none text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {/* Chat input */}
            <div className="justify-self-center px-6 py-2 m-2 bg-white rounded-[12px] border border-[#BBBBBB]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اینجا بنویسید..."
                  className="flex-1 p-2 rounded-lg outline-none focus:outline"
                  dir="rtl"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="text-white flex p-2 rounded-[32px] hover:bg-purple-700 transition-colors disabled:opacity-50"
                  style={{
                    background: "#791469",
                  }}
                >
                  <text>ارسال پیام</text>
                  <img
                    src="/images/send-icon.png"
                    alt="sent button"
                    className="size-[24px] object-contain"
                  />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            یک کاربر را برای شروع گفتگو انتخاب کنید
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;