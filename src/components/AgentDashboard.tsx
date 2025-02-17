// import React, { useState, useEffect } from "react";
// import { io, Socket } from "socket.io-client";
// import { Client, Message } from "../types/types";

// const AgentDashboard: React.FC = () => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [users, setUsers] = useState<Client[]>([]);
//   const [selectedUser, setSelectedUser] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputText, setInputText] = useState<string>("");

//   useEffect(() => {
//     const newSocket = io("http://localhost:2000");
//     setSocket(newSocket);

//     newSocket.on("user-connected", (user: Client) => {
//         console.log("userrrrrrrrrr",user)
//       setUsers((prev) => [...prev, user]);
//     });

//     newSocket.on("new-user-message", ({ message }: { message: Message }) => {
//         console.log("message", message)
//       if (message.clientId === selectedUser) {
//         setMessages((prev) => [...prev, message]);
//       }
//     });

//     newSocket.emit("register-agent");

//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   const handleSendMessage = () => {
//     if (socket && selectedUser && inputText) {
//       socket.emit("agent-message", { clientId: selectedUser, text: inputText });
//       setInputText("");
//     }
//   };

//   const receiveMessages = (clientId:string) => {
//     if (socket) {
//         console.log("socket", clientId, socket)
//         setSelectedUser(clientId)
//       socket.emit("get-client-conversations",  {clientId} , (data:any)=>{
//         console.log("dataaa2", data)
//         setMessages(data.data.messages);
//     });
//     }
//   };

//   return (
//     <div className="p-4 bg-gray-100 rounded-lg shadow-md">
//       <h1 className="text-xl font-bold">Agent Dashboard</h1>
//       <div className="mt-4 flex">
//         <div className="w-1/4">
//           <h2 className="font-bold">Active Users</h2>
//           <ul>
//             {users.map((user) => (
//               <li
//                 key={user.clientId}
//                 onClick={() => receiveMessages(user.clientId)}
//                 className="p-2 hover:bg-gray-200 cursor-pointer"
//               >
//                 {user.name}
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="w-3/4 pl-4">
//         {selectedUser && (
//             <>
//               <div className="h-64 overflow-y-auto">

//                 {messages && messages.length>0 && messages.map((msg) => {
//                     console.log("msgggggg",msg)
//                   return <div key={msg.id} className="p-2 bg-white rounded shadow mb-2">
//                     <strong>{msg.isFromAgent ? "You" : "User"}:</strong> {msg.text}
//                   </div>
// })}
//               </div>
//               <div className="mt-4">
//                 <input
//                   type="text"
//                   placeholder="Type a message"
//                   value={inputText}
//                   onChange={(e) => setInputText(e.target.value)}
//                   className="p-2 border rounded w-full"
//                 />
//                 <button onClick={handleSendMessage} className="p-2 bg-green-500 text-white rounded mt-2">
//                   Send
//                 </button>
//               </div>
//               </>
//          )}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default AgentDashboard;
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Client, Message } from "../types/types";

const AgentDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<Client[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    newSocket.on("user-connected", (user: Client) => {
      setUsers((prev) => {
        // Check if user already exists
        if (!prev.find((u) => u.clientId === user.clientId)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    newSocket.on("new-user-message", ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      if (message.clientId !== selectedUser) {
        setUnreadMessages((prev) => ({
          ...prev,
          [message.clientId]: (prev[message.clientId] || 0) + 1,
        }));
      }
    });

    newSocket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.emit("register-agent");

    return () => {
      newSocket.disconnect();
    };
  }, [selectedUser]);

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
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const receiveMessages = (clientId: string) => {
    if (socket) {
      setSelectedUser(clientId);
      socket.emit("get-client-conversations", { clientId }, (data: any) => {
        setMessages(data.data.messages || []);
      });
      // Clear unread messages for this user
      setUnreadMessages((prev) => ({ ...prev, [clientId]: 0 }));
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-white border-l">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">لیست کاربران</h1>
        </div>
        <div className="overflow-y-auto h-full">
          {users.map((user) => (
            <div
              key={user.clientId}
              onClick={() => receiveMessages(user.clientId)}
              className={`p-4 border-b cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors ${
                selectedUser === user.clientId ? "bg-purple-50" : ""
              }`}
            >
              <div>
                <span className="text-gray-700 ml-2">کاربر</span>
                <span className="text-gray-500 text-sm">{user.clientId}</span>
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
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.isFromAgent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.isFromAgent
                        ? "bg-white text-gray-800 shadow-sm"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  ارسال
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
