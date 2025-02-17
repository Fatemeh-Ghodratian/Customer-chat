export interface Client {
    clientId: string;
    name: string;
    conversation:Conversation
  }
  
  export interface Message {
    id: string;
    text: string;
    clientId: string;
    timestamp: Date;
    isFromAgent: boolean;
  }
  
  export interface Conversation {
    clientId: string;
    messages: Message[];
    unread: number;
  }