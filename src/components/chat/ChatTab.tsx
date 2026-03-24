import { useState } from "react";
import ChatList, { type Conversation } from "./ChatList";
import ChatWindow from "./ChatWindow";

const ChatTab = () => {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  if (activeConv) {
    return (
      <ChatWindow
        conversationId={activeConv.id}
        otherUser={activeConv.other_user}
        onBack={() => setActiveConv(null)}
      />
    );
  }

  return <ChatList onSelectConversation={setActiveConv} />;
};

export default ChatTab;
