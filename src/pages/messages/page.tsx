
import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useTechnicians } from '../../hooks/useSupabase';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'dispatcher' | 'owner' | 'technician';
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'location' | 'urgent';
}

export default function Messages() {
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'urgent'>('text');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { technicians } = useTechnicians();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Mock messages data
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'dispatcher1',
        senderName: 'Dispatcher',
        senderType: 'dispatcher',
        recipientId: 'tech1',
        recipientName: 'John Smith',
        content: 'Hi John, we have an urgent repair at 123 Main St. Customer is waiting. Can you head there now?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        messageType: 'urgent'
      },
      {
        id: '2',
        senderId: 'tech1',
        senderName: 'John Smith',
        senderType: 'technician',
        recipientId: 'dispatcher1',
        recipientName: 'Dispatcher',
        content: 'On my way! ETA 15 minutes. Do we have the part number for the broken component?',
        timestamp: new Date(Date.now() - 3300000).toISOString(),
        isRead: true,
        messageType: 'text'
      },
      {
        id: '3',
        senderId: 'dispatcher1',
        senderName: 'Dispatcher',
        senderType: 'dispatcher',
        recipientId: 'tech1',
        recipientName: 'John Smith',
        content: 'Part #AC-2847. It should be in your van from the morning stock.',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        isRead: true,
        messageType: 'text'
      },
      {
        id: '4',
        senderId: 'owner1',
        senderName: 'Business Owner',
        senderType: 'owner',
        recipientId: 'tech2',
        recipientName: 'Mike Johnson',
        content: 'Great work on the Henderson job yesterday! Customer left a 5-star review.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isRead: false,
        messageType: 'text'
      },
      {
        id: '5',
        senderId: 'tech2',
        senderName: 'Mike Johnson',
        senderType: 'technician',
        recipientId: 'owner1',
        recipientName: 'Business Owner',
        content: 'Thank you! The customer was very understanding about the delay. I made sure to explain everything clearly.',
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        isRead: false,
        messageType: 'text'
      }
    ];
    setMessages(mockMessages);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages for selected technician
  const filteredMessages = selectedTechnician
    ? messages.filter(msg => 
        (msg.senderId === selectedTechnician || msg.recipientId === selectedTechnician) &&
        (msg.senderId === currentUser.email || msg.recipientId === currentUser.email)
      )
    : [];

  // Get technician conversations with last message and unread count
  const technicianConversations = technicians.map(tech => {
    const techMessages = messages.filter(msg => 
      (msg.senderId === tech.id || msg.recipientId === tech.id) &&
      (msg.senderId === currentUser.email || msg.recipientId === currentUser.email)
    );
    
    const lastMessage = techMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    const unreadCount = techMessages.filter(msg => 
      !msg.isRead && msg.recipientId === currentUser.email
    ).length;

    return {
      ...tech,
      lastMessage,
      unreadCount,
      lastActivity: lastMessage?.timestamp || tech.created_at
    };
  }).sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  // Filter technicians by search term
  const filteredTechnicians = technicianConversations.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTechnician) return;

    const selectedTech = technicians.find(t => t.id === selectedTechnician);
    if (!selectedTech) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderType: currentUser.userType,
      recipientId: selectedTechnician,
      recipientName: selectedTech.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setMessageType('text');

    // Simulate technician typing response for demo
    if (Math.random() > 0.5) {
      setIsTyping(true);
      setTimeout(() => {
        const responses = [
          'Got it, thanks!',
          'On my way!',
          'Will handle this right away.',
          'Thanks for the update.',
          'Understood, will keep you posted.',
          'Perfect, I have everything I need.'
        ];
        
        const response: Message = {
          id: (Date.now() + 1).toString(),
          senderId: selectedTechnician,
          senderName: selectedTech.name,
          senderType: 'technician',
          recipientId: currentUser.email,
          recipientName: currentUser.name,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          isRead: false,
          messageType: 'text'
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const selectedTechData = selectedTechnician 
    ? technicians.find(t => t.id === selectedTechnician)
    : null;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with your technicians in real-time</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{technicians.filter(t => t.status === 'active').length} technicians online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Technicians List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search technicians..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredTechnicians.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTechnician === tech.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {tech.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          tech.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{tech.name}</h3>
                          {tech.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {tech.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{tech.phone}</p>
                        {tech.lastMessage && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 truncate flex-1 mr-2">
                              {tech.lastMessage.messageType === 'urgent' && (
                                <i className="ri-error-warning-fill text-red-500 mr-1"></i>
                              )}
                              {tech.lastMessage.content}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatTime(tech.lastMessage.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTechnicians.length === 0 && (
                  <div className="p-8 text-center">
                    <i className="ri-user-search-line text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500">No technicians found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedTechData ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {selectedTechData.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            selectedTechData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedTechData.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedTechData.status === 'active' ? 'Online' : 'Offline'} • {selectedTechData.phone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <i className="ri-phone-line text-lg"></i>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <i className="ri-more-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {filteredMessages.map((message) => {
                      const isFromCurrentUser = message.senderId === currentUser.email;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isFromCurrentUser
                                  ? message.messageType === 'urgent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.messageType === 'urgent' && (
                                <div className="flex items-center mb-1">
                                  <i className="ri-error-warning-fill mr-1 text-sm"></i>
                                  <span className="text-xs font-medium">URGENT</span>
                                </div>
                              )}
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${isFromCurrentUser ? 'text-right' : 'text-left'}`}>
                              {formatTime(message.timestamp)}
                              {isFromCurrentUser && message.isRead && (
                                <i className="ri-check-double-line ml-1 text-blue-500"></i>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => setMessageType(messageType === 'urgent' ? 'text' : 'urgent')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                              messageType === 'urgent' 
                                ? 'text-red-500 bg-red-50' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                            title="Mark as urgent"
                          >
                            <i className="ri-error-warning-line text-lg"></i>
                          </button>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 rounded-full"
                      >
                        <i className="ri-send-plane-fill"></i>
                      </Button>
                    </div>
                    
                    {messageType === 'urgent' && (
                      <p className="text-xs text-red-600 mt-2 flex items-center">
                        <i className="ri-error-warning-line mr-1"></i>
                        This message will be marked as urgent
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-message-3-line text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Technician</h3>
                    <p className="text-gray-500">Choose a technician from the list to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
