import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "../types/types";

const AgentAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-[36px] h-[36px] rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
      {initials}
    </div>
  );
};
const toPersianDigits = (num: string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const formatPersianTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "ب.ظ" : "ق.ظ";
  const hour12 = hours % 12 || 12;

  return `${toPersianDigits(hour12.toString())}:${toPersianDigits(
    minutes
  )} ${ampm}`;
};

const ClientWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    if (!localStorage.getItem("clientId")) {
      const clientId = makeId(5);
      const clientName = makeId(10);
      localStorage.setItem("clientId", clientId);
      localStorage.setItem("clientName", clientName);
    }

    newSocket?.emit(
      "get-client-conversations",
      { clientId: localStorage.getItem("clientId") },
      (data: any) => {
        setMessages(data.data?.messages || []);
      }
    );

    newSocket?.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRegister = () => {
    if (socket) {
      socket.emit("register-user", {
        clientId: localStorage.getItem("clientId"),
        name: localStorage.getItem("clientName"),
      });
    }
  };

  const handleSendMessage = () => {
    if (socket && localStorage.getItem("clientId") && inputText.trim()) {
      socket.emit("user-message", {
        clientId: localStorage.getItem("clientId"),
        text: inputText.trim(),
      });
      setInputText("");
    }
  };

  const makeId = (length: number) => {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 font-sans" dir="rtl">
      {/* Chat Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) handleRegister();
        }}
        style={{ padding: 0, border: "none" }}
        className="p-0 bg-transparent border-none hover:opacity-90 transition-all flex items-center justify-center"
      >
        <img
          src="/images/raychat-logo.png"
          alt="Chat Support"
          className="size-[55px] object-contain"
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-lg flex flex-col">
          {/* Chat Header */}
          <div className="bg-[#5B4DFF] text-white p-4 rounded-t-[12px] border border-white">
            <div className="flex items-center gap-3">
              <AgentAvatar name="پشتیبان سایت" />
              <div>
                <h2 className="text-lg font-bold">پشتیبانی آنلاین</h2>
                <p className="text-sm opacity-90">پاسخگوی سوالات شما هستیم</p>
              </div>
            </div>
          </div>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-1">
                <div
                  className={`flex ${
                    msg.isFromAgent ? "justify-start" : "justify-end"
                  } items-start gap-2`}
                >
                  {msg.isFromAgent && <AgentAvatar name="پشتیبان سایت" />}
                  <div
                    className={`p-3 rounded-lg max-w-[80%] break-words whitespace-pre-wrap ${
                      msg.isFromAgent
                        ? "bg-gray-100 text-gray-800"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                <div
                  className={`text-xs text-gray-500 ${
                    msg.isFromAgent ? "mr-12 text-right" : "ml-2 text-left"
                  }`}
                >
                  {formatPersianTime(new Date(msg.timestamp).getTime())}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientWidget;
