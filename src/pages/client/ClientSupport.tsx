// src/pages/client/ClientSupport.tsx

import { useState } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Headphones,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../utils/menuItems';

// ==================== FAQ DATA ====================
const faqs = [
  {
    question: 'How do I place a new order?',
    answer:
      'Navigate to "New Order" from the sidebar menu. Select your project, choose the required materials, specify delivery dates and quantities, then submit your order for processing.',
  },
  {
    question: 'Can I edit an order after submitting it?',
    answer:
      'Yes, orders can be edited while they are still in "Pending" status. Once an order has been confirmed or assigned to a supplier, please contact our support team to request changes.',
  },
  {
    question: 'How do split deliveries work?',
    answer:
      'Split deliveries allow you to receive the same order items across multiple dates. When creating an order, you can specify different delivery dates and quantities for each delivery slot.',
  },
  {
    question: 'How is pricing calculated?',
    answer:
      'Pricing is calculated based on the materials selected, quantities ordered, and delivery costs. You can view a detailed cost breakdown in the order summary before confirming your order.',
  },
  {
    question: 'How do I track my order status?',
    answer:
      'Go to "Orders" from the sidebar to view all your orders. Each order displays its current status. Click on any order to see detailed tracking information including delivery schedules.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We currently support invoice-based payments. Once your order is delivered, an invoice will be generated and available for download from the order details page.',
  },
  {
    question: 'How do I create or manage projects?',
    answer:
      'Go to "Projects" from the sidebar. You can create new projects with site details and delivery addresses. Each order must be linked to a project for proper tracking and delivery.',
  },
  {
    question: 'What should I do if there is an issue with my delivery?',
    answer:
      'If you experience any issues with your delivery, please contact our support team immediately via email or phone. Provide your order number and a description of the issue so we can resolve it quickly.',
  },
];

// ==================== FAQ ITEM COMPONENT ====================
const FAQItem = ({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden transition-all">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
        isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <span className={`font-medium text-sm ${isOpen ? 'text-blue-700' : 'text-gray-800'}`}>
        {faq.question}
      </span>
      {isOpen ? (
        <ChevronUp size={18} className="text-blue-600 flex-shrink-0 ml-3" />
      ) : (
        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 ml-3" />
      )}
    </button>
    {isOpen && (
      <div className="px-5 py-4 bg-white border-t border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
      </div>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================
const ClientSupport = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <Headphones className="w-8 h-8 text-blue-600" />
            Customer Support
          </h1>
          <p className="text-gray-600 mt-1">Find answers to common questions or get in touch with our team</p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={22} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <a
                  href="mailto:support@materialconnect.com.au"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1 block"
                >
                  support@materialconnect.com.au
                </a>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>We typically respond within 24 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={22} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                <a
                  href="tel:+61485985477"
                  className="text-green-600 hover:text-green-700 text-xs font-medium block"
                >
                  Alternate: 0485 985 477
                </a>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>Mon – Fri, 8:00 AM – 5:00 PM AEST</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MessageCircle size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Frequently Asked Questions</h2>
                <p className="text-xs text-gray-500 mt-0.5">Quick answers to common questions</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-2.5">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 text-center">
          <HelpCircle size={32} className="text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Still need help?</h3>
          <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
            If you couldn't find the answer you were looking for, don't hesitate to reach out to our support team via email or phone.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientSupport;