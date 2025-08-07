import React from 'react';
import { FaEnvelope, FaPhone, FaBuilding, FaQuestionCircle, FaTicketAlt, FaComments, FaDownload } from 'react-icons/fa';

const Support = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-[#1e1e1e] mb-6">Support</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[#8C001A] text-xl">
                <FaEnvelope />
              </div>
              <h2 className="font-bold text-lg text-[#8C001A]">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaEnvelope className="text-gray-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">support@dypatil.edu</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaPhone className="text-gray-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-gray-600">+91 123-456-7890</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaBuilding className="text-gray-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Office</p>
                  <p className="text-gray-600">Room 101, Admin Block</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[#8C001A] text-xl">
                <FaQuestionCircle />
              </div>
              <h2 className="font-bold text-lg text-[#8C001A]">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">How do I apply for leave?</h3>
                <p className="text-sm text-gray-600">Navigate to "Apply Leave" in the sidebar and fill out the required form.</p>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">How long does approval take?</h3>
                <p className="text-sm text-gray-600">Leave requests are typically processed within 2-3 working days.</p>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">Can I cancel my leave request?</h3>
                <p className="text-sm text-gray-600">Yes, you can cancel pending requests from "My Requests" section.</p>
              </div>
              
              <div className="pb-4">
                <h3 className="font-medium text-gray-900 mb-2">What documents do I need?</h3>
                <p className="text-sm text-gray-600">Medical certificates for medical leave and relevant documents for other leave types.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaTicketAlt />
            </div>
            <h2 className="font-bold text-lg text-[#8C001A]">Quick Actions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
              <FaTicketAlt />
              Submit Ticket
            </button>
            <button className="flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium">
              <FaComments />
              Live Chat
            </button>
            <button className="flex items-center justify-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium">
              <FaDownload />
              Download Manual
            </button>
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="font-bold text-lg text-[#8C001A] mb-4">Support Hours</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-medium text-gray-900">Monday - Friday</span>
                <span className="text-gray-600">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-medium text-gray-900">Saturday</span>
                <span className="text-gray-600">9:00 AM - 1:00 PM</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-medium text-gray-900">Sunday</span>
                <span className="text-gray-600">Closed</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
              <p className="text-sm text-gray-600 mb-2">For urgent matters outside business hours:</p>
              <p className="text-gray-900 font-medium">+91 987-654-3210</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support; 