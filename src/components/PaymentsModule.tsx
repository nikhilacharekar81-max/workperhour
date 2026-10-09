import React, { useState } from 'react';
import { ShieldCheck, FileText, Settings, Calculator, ChevronRight } from 'lucide-react';

export const PaymentsModule: React.FC<{ gigs: Gig[], orders: Order[], projects: Project[], proposals: Proposal[], currentUser: UserAccount }> = ({ gigs, orders, projects, proposals, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'money' | 'statements' | 'invoices' | 'transactions' | 'methods'>('money');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showBuyerEscrowDetails, setShowBuyerEscrowDetails] = useState(false);

  const tabs = [
    { id: 'money', label: 'My Money' },
    { id: 'statements', label: 'Statements' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'methods', label: 'Payment methods' },
  ];

  const AccountCard = ({ title, desc, data, onClick }: { title: string, desc: string, data: any[], onClick?: () => void }) => (
    <div 
      className={`bg-white border border-slate-200 rounded-lg p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-400 transition' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{desc}</p>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500 font-semibold border-b">
          <tr>
            <th className="pb-2">Currency</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 text-slate-600">{item.currency}</td>
              <td className="py-2 text-right font-bold text-slate-900">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-100 min-h-screen">
      <h1 className="text-4xl font-normal text-slate-800 mb-6">Payments</h1>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex border-b border-slate-300">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium ${activeTab === tab.id ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'money' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AccountCard 
                  title="User Account" 
                  desc="Available money" 
                  data={[{currency: 'US dollar', amount: `$${currentUser.walletBalance.toLocaleString()}`}]}
                  onClick={() => setShowAccountDetails(!showAccountDetails)}
                />
                <AccountCard 
                  title="Buyer Escrow" 
                  desc="Work others are doing for me" 
                  data={[{currency: 'US dollar', amount: '$0.00'}]}
                  onClick={() => setShowBuyerEscrowDetails(!showBuyerEscrowDetails)}
                />
                <AccountCard 
                  title="Freelancer Escrow" 
                  desc="Work I am doing for others" 
                  data={[{currency: 'US dollar', amount: '$9.14'}]}
                />
              </div>
              
              {showAccountDetails && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                      <tr>
                        <th className="p-4 text-left">Currency</th>
                        <th className="p-4 text-left">Available</th>
                        <th className="p-4 text-left">Available for withdraw</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-4 font-bold">USD</td>
                        <td className="p-4">${currentUser.walletBalance.toLocaleString()}</td>
                        <td className="p-4">${currentUser.walletBalance.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {showBuyerEscrowDetails && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                      <tr>
                        <th className="p-4 text-left">Description</th>
                        <th className="p-4 text-left">In Escrow</th>
                        <th className="p-4 text-left">Deposit Requests</th>
                        <th className="p-4 text-left">Invoices</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders
                        .filter(o => o.buyerId === currentUser.id && ['funded_in_escrow', 'in_progress'].includes(o.status))
                        .map((order) => {
                          const associatedGig = gigs.find(g => g.id === order.gigId);
                          const associatedProject = projects.find(p => p.id === order.projectId);
                          
                          return (
                            <tr key={order.id}>
                              <td className="p-4 text-blue-600">
                                {order.title}
                                <div className="text-xs text-slate-500">
                                  {associatedGig ? `Gig: ${associatedGig.title}` : associatedProject ? `Project: ${associatedProject.title}` : 'General Order'}
                                </div>
                              </td>
                              <td className="p-4">${order.amount.toFixed(2)}</td>
                              <td className="p-4">-</td>
                              <td className="p-4">✓ ${order.amount.toFixed(2)}</td>
                              <td className="p-4 text-emerald-600 font-semibold">↑ Escrow Deposit</td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'money' && (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
              <p>No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} found.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> CONTROL PANEL
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Paid this month', value: '$0.00' },
                { label: 'Paid to date', value: '$814.20' },
                { label: 'Earned this month', value: '$0.00' },
                { label: 'Earned to date', value: '$169.9K' },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Earned past two months</span>
                  <span className="font-bold text-slate-900">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Clearing period</span>
                  <span className="font-bold text-slate-900">14 days</span>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Learn more</button>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold text-slate-800 mb-2">Service Fees*</h3>
              <div className="text-sm space-y-1 text-slate-600">
                <p>First $7,000 earned with a Buyer (excl. VAT) <span className="font-bold">7.5%</span></p>
                <p>Over $7,000 earned with a Buyer <span className="font-bold">3.5%</span></p>
                <p className="text-xs text-slate-400 mt-2">*Work billed under the Zero Commission scheme is excluded</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4 space-y-3 text-sm text-slate-700">
              <button className="flex items-center gap-2 hover:text-blue-600"><ShieldCheck size={16}/> Escrow Deposit</button>
              <button className="flex items-center gap-2 hover:text-blue-600"><FileText size={16}/> Create Invoice</button>
              <button className="flex items-center gap-2 hover:text-blue-600"><Settings size={16}/> Payment Settings</button>
              <button className="flex items-center gap-2 hover:text-blue-600"><Calculator size={16}/> Earnings Calculator</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
