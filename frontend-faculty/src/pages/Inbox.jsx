import React, { useState, useEffect } from 'react';
import { FaInbox, FaEnvelope, FaEnvelopeOpen, FaReply, FaForward, FaStar, FaSearch, FaFilter } from 'react-icons/fa';
import deleteIcon from '../assets/delete.svg';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read, starred
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock inbox data - replace with real API call
  const mockMessages = [
    {
      id: 1,
      from: 'John Doe',
      fromEmail: 'john.doe@dypatil.edu',
      subject: 'Leave Request Approval Required',
      preview: 'A new leave request has been submitted and requires your approval...',
      body: 'Dear Admin,\n\nA new leave request has been submitted by faculty member Sarah Johnson for medical leave from March 15-20, 2024. Please review and approve this request.\n\nBest regards,\nJohn Doe\nHOD - Computer Engineering',
      timestamp: '2024-03-10T09:30:00Z',
      read: false,
      starred: true,
      type: 'leave_request'
    },
    {
      id: 2,
      from: 'System Administrator',
      fromEmail: 'system@dypatil.edu',
      subject: 'System Maintenance Notice',
      preview: 'Scheduled maintenance will be performed on the attendance system...',
      body: 'Dear Admin,\n\nScheduled maintenance will be performed on the attendance management system on March 12, 2024 from 2:00 AM to 4:00 AM. During this time, the system will be temporarily unavailable.\n\nWe apologize for any inconvenience.\n\nBest regards,\nSystem Administrator',
      timestamp: '2024-03-09T14:15:00Z',
      read: true,
      starred: false,
      type: 'system_notice'
    },
    {
      id: 3,
      from: 'HR Department',
      fromEmail: 'hr@dypatil.edu',
      subject: 'New Faculty Registration',
      preview: 'New faculty member registration completed successfully...',
      body: 'Dear Admin,\n\nNew faculty member Dr. Michael Chen has been successfully registered in the system. Please review their profile and assign appropriate permissions.\n\nFaculty Details:\n- Name: Dr. Michael Chen\n- Department: Information Technology\n- SDRN: FAC085\n- Email: michael.chen@dypatil.edu\n\nBest regards,\nHR Department',
      timestamp: '2024-03-08T11:45:00Z',
      read: true,
      starred: false,
      type: 'registration'
    },
    {
      id: 4,
      from: 'Principal Office',
      fromEmail: 'principal@dypatil.edu',
      subject: 'Monthly Report Due',
      preview: 'Monthly attendance and leave report is due by end of week...',
      body: 'Dear Admin,\n\nThe monthly attendance and leave report for February 2024 is due by Friday, March 15, 2024. Please ensure all data is up to date and submit the report to the principal office.\n\nRequired information:\n- Department-wise attendance summary\n- Leave balance reports\n- Pending leave requests\n- System usage statistics\n\nBest regards,\nPrincipal Office',
      timestamp: '2024-03-07T16:20:00Z',
      read: false,
      starred: true,
      type: 'report'
    },
    {
      id: 5,
      from: 'IT Support',
      fromEmail: 'support@dypatil.edu',
      subject: 'Password Reset Request',
      preview: 'Password reset request received for faculty account...',
      body: 'Dear Admin,\n\nA password reset request has been received for faculty account SDRN: FAC042. Please verify the request and reset the password if legitimate.\n\nRequest Details:\n- Faculty: Dr. Priya Sharma\n- Department: Electronics Engineering\n- Request Time: March 6, 2024 3:30 PM\n\nBest regards,\nIT Support Team',
      timestamp: '2024-03-06T15:30:00Z',
      read: true,
      starred: false,
      type: 'support'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMessages = messages.filter(message => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && !message.read) ||
      (filter === 'read' && message.read) ||
      (filter === 'starred' && message.starred);
    
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    // Mark as read
    if (!message.read) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        )
      );
    }
  };

  const handleStarToggle = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
      )
    );
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = () => messages.filter(msg => !msg.read).length;
  const getStarredCount = () => messages.filter(msg => msg.starred).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C001A]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Inbox Content */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="h-[76vh] flex bg-gray-50">
            {/* Left Sidebar - Message List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
              {/* Search and Filters Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <FaInbox className="text-[#8C001A] text-xl" />
                  <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C001A] focus:border-[#8C001A]"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                      filter === 'all' ? 'bg-[#8C001A] text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>All</span>
                    <span className="text-xs">{messages.length}</span>
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                      filter === 'unread' ? 'bg-[#8C001A] text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>Unread</span>
                    <span className="text-xs">{getUnreadCount()}</span>
                  </button>
                  <button
                    onClick={() => setFilter('starred')}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                      filter === 'starred' ? 'bg-[#8C001A] text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>Starred</span>
                    <span className="text-xs">{getStarredCount()}</span>
                  </button>
                </div>
              </div>

              {/* Message List - Takes full remaining height */}
              <div className="flex-1 overflow-y-auto bg-white">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FaInbox className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No messages found</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedMessage?.id === message.id ? 'bg-blue-50 border-r-2 border-[#8C001A]' : ''
                        } ${!message.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`font-semibold text-sm truncate ${!message.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {message.from}
                            </span>
                            {!message.read && (
                              <div className="w-2 h-2 bg-[#8C001A] rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStarToggle(message.id);
                              }}
                              className={`p-1 rounded hover:bg-gray-100 ${message.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                            >
                              <FaStar className="text-sm" />
                            </button>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className={`font-medium text-sm mb-1 truncate ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {message.subject}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {message.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Message Content */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedMessage ? (
                <>
                  {/* Message Header */}
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          ← Back to Messages
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800">{selectedMessage.subject}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStarToggle(selectedMessage.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            selectedMessage.starred ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                          }`}
                        >
                          <FaStar />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <FaReply />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <FaForward />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <img src={deleteIcon} alt="Delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div>
                        <span className="font-medium">From:</span> {selectedMessage.from} ({selectedMessage.fromEmail})
                      </div>
                      <div>
                        {formatTimestamp(selectedMessage.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                        {selectedMessage.body}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaInbox className="text-6xl mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-medium mb-2">Select a message</h3>
                    <p>Choose a message from the list to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox; 