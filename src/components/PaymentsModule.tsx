import React, { useState } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, Clock, 
  CreditCard, Calendar, Filter, Download, MoreVertical, 
  Search, ShieldCheck, AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'earning' | 'withdrawal' | 'deposit';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

const mockTransactions: Transaction[] = [
  { id: '1', date: '2026-10-08', description: 'Payment for Gig: Full stack React App', type: 'earning', amount: 1500, status: 'completed' },
  { id: '2', date: '2026-10-07', description: 'Withdrawal to Bank Account', type: 'withdrawal', amount: 500, status: 'completed' },
  { id: '3', date: '2026-10-05', description: 'Payment for Gig: SEO Backlinks', type: 'earning', amount: 200, status: 'pending' },
  { id: '4', date: '2026-10-01', description: 'Deposit via Credit Card', type: 'deposit', amount: 1000, status: 'completed' },
];

export const PaymentsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'earnings' | 'withdrawals'>('all');

  const filteredTransactions = activeTab === 'all' 
    ? mockTransactions 
    : mockTransactions.filter(t => t.type === (activeTab === 'earnings' ? 'earning' : 'withdrawal'));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payments & Earnings</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-3xl font-bold mt-2">$2,450.00</p>
          <button className="mt-4 text-blue-600 font-semibold">Withdraw Funds</button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Pending Earnings</p>
          <p className="text-3xl font-bold mt-2">$200.00</p>
          <p className="text-sm text-gray-400 mt-1">From 1 active order</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-3xl font-bold mt-2">$48,500.00</p>
          <p className="text-sm text-gray-400 mt-1">Lifetime earnings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button 
            className={`px-6 py-4 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('all')}
          >
            All Transactions
          </button>
          <button 
            className={`px-6 py-4 font-medium ${activeTab === 'earnings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings
          </button>
          <button 
            className={`px-6 py-4 font-medium ${activeTab === 'withdrawals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Withdrawals
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions.map(txn => (
              <tr key={txn.id}>
                <td className="px-6 py-4 text-sm">{txn.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{txn.description}</td>
                <td className="px-6 py-4 text-sm capitalize">{txn.type}</td>
                <td className={`px-6 py-4 text-sm font-bold ${txn.type === 'earning' ? 'text-green-600' : 'text-gray-900'}`}>
                  {txn.type === 'earning' ? '+' : '-'}${txn.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                    txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {txn.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
