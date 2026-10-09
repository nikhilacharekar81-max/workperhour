import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Clock, DollarSign, CheckCircle2, AlertTriangle,
  ArrowRight, ArrowLeft, ExternalLink, Download, FileUp, Send,
  Lock, Unlock, MessageSquare, AlertCircle, FileText, Check, X,
  User, Copy, Sparkles, RefreshCw, Layers, ShieldCheck, Flag,
  ChevronRight, Calendar, UserX
} from 'lucide-react';

export interface OrderItem {
  id: string;
  title: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'funded_in_escrow' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'revision' | 'cancelled';
  createdAt: string;
  dueDate: string;
  requirements?: string;
  deliverables?: string;
  deliverableFiles?: Array<{ id: string; name: string; url: string; size: string; uploadedAt: string }>;
  revisions?: Array<{ id: string; requestedAt: string; reason: string; status: string }>;
  adminNotes?: string;
  isMuted?: boolean;
  escrowProtectionStartDate?: string;
  escrowProtectionEndDate?: string;
  gigId?: string;
  projectId?: string;
  serviceUrl?: string;
  gigSlug?: string;
  sellerUsername?: string;
  serviceTitle?: string;
}

interface MessageItem {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  walletBalance?: number;
}

interface AdminOrdersManagerProps {
  orders: OrderItem[];
  users: UserAccount[];
  gigs: any[];
  currentUser?: any;
  onRefreshOrders: () => void;
  getGigUrl: (gig: any) => string;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  users,
  gigs,
  currentUser,
  onRefreshOrders,
  getGigUrl
}) => {
  // Navigation & Filtering
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'delivered' | 'completed' | 'revision' | 'disputed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Selected Order for Workspace
  const [activeWorkspaceOrder, setActiveWorkspaceOrder] = useState<OrderItem | null>(null);
  const [workspaceMessages, setWorkspaceMessages] = useState<MessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // Modals inside Workspace
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(2);
  const [extendCustomDate, setExtendCustomDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialRefundAmount, setPartialRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('4.2 MB');

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync active order on prop update
  useEffect(() => {
    if (activeWorkspaceOrder) {
      const refreshed = orders.find(o => o.id === activeWorkspaceOrder.id);
      if (refreshed) {
        setActiveWorkspaceOrder(refreshed);
        setAdminNoteInput(refreshed.adminNotes || '');
      }
    }
  }, [orders]);

  // Load Workspace Detail when opened
  const handleOpenWorkspace = async (order: OrderItem) => {
    setActiveWorkspaceOrder(order);
    setAdminNoteInput(order.adminNotes || '');
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(data);
        setWorkspaceMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching order workspace:', err);
    }
  };

  const handleCloseWorkspace = () => {
    setActiveWorkspaceOrder(null);
    setActionFeedback(null);
  };

  // Helper: Copy ID
  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper: Calculate Remaining Time or Overdue
  const getDueTimeStatus = (dueDateStr: string, status: string) => {
    if (status === 'completed') return { text: 'Completed', color: 'text-emerald-400', isOverdue: false };
    if (status === 'cancelled') return { text: 'Cancelled', color: 'text-slate-500', isOverdue: false };
    if (status === 'delivered') return { text: 'Review Period (Auto-completes in 3d)', color: 'text-purple-400', isOverdue: false };

    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diffMs = due - now;

    if (diffMs < 0) {
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const overdueDays = Math.floor(overdueHours / 24);
      return {
        text: overdueDays > 0 ? `+${overdueDays}d Overdue` : `+${overdueHours}h Overdue`,
        color: 'text-rose-400 font-extrabold animate-pulse',
        isOverdue: true
      };
    }

    const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
    const remainingDays = Math.floor(remainingHours / 24);

    if (remainingDays > 1) {
      return { text: `${remainingDays} days remaining`, color: 'text-emerald-400', isOverdue: false };
    } else if (remainingDays === 1) {
      return { text: `1 day left`, color: 'text-amber-400', isOverdue: false };
    } else {
      return { text: `${remainingHours}h remaining`, color: 'text-amber-400 font-bold', isOverdue: false };
    }
  };

  // Resolve Canonical Gig / Service URL
  const resolveOrderUrl = (o: OrderItem) => {
    if (o.serviceUrl && o.serviceUrl.startsWith('/')) return o.serviceUrl;
    if (o.gigId) {
      const gig = gigs.find(g => g.id === o.gigId);
      if (gig) return getGigUrl(gig);
    }
    const gigBySeller = gigs.find(g => g.freelancerId === o.sellerId) || gigs.find(g => g.title.toLowerCase() === o.title.toLowerCase());
    if (gigBySeller) return getGigUrl(gigBySeller);
    const t = o.title.toLowerCase();
    if (t.includes('puppet') || o.id === 'ord_bk') return '/broadcastking/create-an-amazing-promotional-explainer-video-a-puppet';
    if (t.includes('saas') || t.includes('full stack') || o.id === 'ord_1') return '/elena_rostova/i-will-build-a-high-performance-full-stack-web-app-in-react-and-node';
    if (t.includes('ahrefs') || t.includes('dr 70') || o.id === 'ord_bushra') return '/bushra/i-will-increase-ahrefs-domain-rating-dr-70-using-high-authority-seo-backlinks';
    return '/gigs';
  };

  // Filter orders by sub-tab and search
  const filteredOrders = orders.filter(o => {
    // 1. Sub-Tab filter
    if (statusTab === 'active' && o.status !== 'in_progress' && o.status !== 'funded_in_escrow') return false;
    if (statusTab === 'delivered' && o.status !== 'delivered') return false;
    if (statusTab === 'completed' && o.status !== 'completed') return false;
    if (statusTab === 'revision' && o.status !== 'revision') return false;
    if (statusTab === 'disputed' && o.status !== 'disputed') return false;
    if (statusTab === 'cancelled' && o.status !== 'cancelled') return false;

    // 2. Overdue filter
    if (showOverdueOnly) {
      const dueStatus = getDueTimeStatus(o.dueDate, o.status);
      if (!dueStatus.isOverdue) return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const buyer = users.find(u => u.id === o.buyerId);
      const seller = users.find(u => u.id === o.sellerId);
      const matchesId = o.id.toLowerCase().includes(q);
      const matchesTitle = o.title.toLowerCase().includes(q);
      const matchesBuyer = buyer ? buyer.name.toLowerCase().includes(q) || buyer.email.toLowerCase().includes(q) : false;
      const matchesSeller = seller ? seller.name.toLowerCase().includes(q) || seller.email.toLowerCase().includes(q) : false;
      return matchesId || matchesTitle || matchesBuyer || matchesSeller;
    }

    return true;
  });

  // Action: Save Admin Note
  const handleSaveAdminNote = async () => {
    if (!activeWorkspaceOrder) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/admin-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNoteInput })
      });
      if (res.ok) {
        setNoteSavedSuccess(true);
        setTimeout(() => setNoteSavedSuccess(false), 2500);
        onRefreshOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Action: Extend Deadline
  const handleExecuteExtendDeadline = async () => {
    if (!activeWorkspaceOrder) return;
    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/extend-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: extendCustomDate ? undefined : extendDays,
          newDueDate: extendCustomDate || undefined,
          reason: extendReason
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(data.order);
        if (data.message) setWorkspaceMessages(prev => [...prev, data.message]);
        setIsExtendModalOpen(false);
        setExtendReason('');
        setActionFeedback({ type: 'success', message: `Deadline extended successfully to ${data.order.dueDate}!` });
        onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'error', message: 'Failed to extend deadline.' });
    }
  };

  // Action: Approve & Release Funds
  const handleExecuteReleaseFunds = async () => {
    if (!activeWorkspaceOrder) return;
    const confirmMsg = `Are you sure you want to approve Order #${activeWorkspaceOrder.id} and release $${(activeWorkspaceOrder.amount * 0.9).toFixed(2)} net to the freelancer?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/force-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: currentUser?.name || 'Super Admin' })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(data.order);
        setActionFeedback({ type: 'success', message: 'Order completed and funds released to freelancer wallet!' });
        onRefreshOrders();
      } else {
        const errData = await res.json();
        setActionFeedback({ type: 'error', message: errData.error || 'Failed to release escrow funds.' });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'error', message: 'Network error releasing funds.' });
    }
  };

  // Action: Cancel & Refund
  const handleExecuteRefund = async () => {
    if (!activeWorkspaceOrder) return;
    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/force-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundType,
          customAmount: refundType === 'partial' ? partialRefundAmount : activeWorkspaceOrder.amount,
          reason: refundReason || 'Administrative cancellation and refund',
          actor: currentUser?.name || 'Super Admin'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(data.order);
        setIsRefundModalOpen(false);
        setRefundReason('');
        setActionFeedback({ type: 'success', message: 'Order cancelled and funds refunded back to buyer wallet!' });
        onRefreshOrders();
      } else {
        const errData = await res.json();
        setActionFeedback({ type: 'error', message: errData.error || 'Failed to refund order.' });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'error', message: 'Network error processing refund.' });
    }
  };

  // Action: Upload Deliverable Override
  const handleExecuteUploadDeliverable = async () => {
    if (!activeWorkspaceOrder || !uploadFileName) return;
    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/deliverable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadFileName,
          size: uploadFileSize || '2.4 MB'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(data.order);
        setIsUploadModalOpen(false);
        setUploadFileName('');
        setActionFeedback({ type: 'success', message: 'Deliverable file uploaded successfully!' });
        onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Toggle Chat Mute
  const handleToggleMute = async () => {
    if (!activeWorkspaceOrder) return;
    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/mute`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspaceOrder(prev => prev ? { ...prev, isMuted: data.isMuted } : null);
        setActionFeedback({
          type: 'success',
          message: data.isMuted ? 'Chat muted. Neither party can send messages.' : 'Chat unmuted. Standard messaging restored.'
        });
        onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceOrder || !chatInput.trim()) return;

    try {
      const res = await fetch(`/api/orders/${activeWorkspaceOrder.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chatInput.trim(),
          senderId: currentUser?.id || 'user_admin',
          senderName: 'Platform Support Desk',
          senderRole: 'admin'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceMessages(prev => [...prev, data.message]);
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Status Count Badges
  const counts = {
    all: orders.length,
    active: orders.filter(o => o.status === 'in_progress' || o.status === 'funded_in_escrow').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revision: orders.filter(o => o.status === 'revision').length,
    disputed: orders.filter(o => o.status === 'disputed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  // =========================================================================
  // VIEW 1: DEDICATED WORKSTREAM SPLIT-SCREEN WORKSPACE
  // =========================================================================
  if (activeWorkspaceOrder) {
    const o = activeWorkspaceOrder;
    const buyer = users.find(u => u.id === o.buyerId);
    const seller = users.find(u => u.id === o.sellerId);
    const serviceUrl = resolveOrderUrl(o);
    const dueTime = getDueTimeStatus(o.dueDate, o.status);
    const platformCommission = Math.round(o.amount * 0.10);
    const freelancerNet = o.amount - platformCommission;

    return (
      <div className="space-y-6">
        {/* Workspace Top Header */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseWorkspace}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Orders</span>
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white">{o.title}</h2>
                  <a
                    href={serviceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-slate-800 rounded text-emerald-400 cursor-pointer inline-flex items-center"
                    title="Open live gig webpage"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="font-mono bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Order #{o.id}
                  </span>
                  <span>Created: {o.createdAt}</span>
                  <span className={`font-mono font-bold ${dueTime.color}`}>
                    ⏱️ Due: {o.dueDate} ({dueTime.text})
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Quick Pill */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase border ${
                o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                o.status === 'disputed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                o.status === 'delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                o.status === 'revision' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {o.status.replace('_', ' ')}
              </span>

              {o.isMuted && (
                <span className="px-2.5 py-1 rounded-lg text-xs bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Muted
                </span>
              )}
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/60 border-red-500/30 text-red-300'
            }`}>
              <span>{actionFeedback.message}</span>
              <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Dispute Alert (if disputed) */}
          {o.status === 'disputed' && (
            <div className="mt-4 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-300">Active Dispute Under Administrative Review</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    A formal dispute was filed. Escrow funds are frozen until an administrator approves release or cancellation.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExecuteReleaseFunds}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Resolve & Release
                </button>
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Resolve & Refund
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2-Panel Split-Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =================================================================== */}
          {/* LEFT PANEL (7 / 12 Cols): Order Brief, Deliverables, Chat & Notes */}
          {/* =================================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Order Brief & Scope */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>1. Order Scope & Client Requirements</span>
              </h3>
              <p className="text-sm text-slate-200 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                {o.requirements || 'No specific requirement notes provided by buyer.'}
              </p>
              {o.deliverables && (
                <div className="text-xs text-slate-400 pt-1">
                  <span className="font-bold text-slate-300">Agreed Deliverables:</span> {o.deliverables}
                </div>
              )}
            </div>

            {/* Card 2: Submitted Deliverables & Files */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>2. Deliverables & File Attachments</span>
                </h3>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Override</span>
                </button>
              </div>

              {o.deliverableFiles && o.deliverableFiles.length > 0 ? (
                <div className="space-y-2">
                  {o.deliverableFiles.map((file, i) => (
                    <div key={file.id || i} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{file.name}</span>
                          <span className="text-[11px] text-slate-400">{file.size} · Uploaded {file.uploadedAt}</span>
                        </div>
                      </div>

                      <a
                        href={file.url || '#'}
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Simulated download: "${file.name}" is clean and ready for inspection.`);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-500">
                  No deliverables submitted yet. Freelancer is currently working on project assets.
                </div>
              )}
            </div>

            {/* Card 3: Revision History (if any) */}
            {o.revisions && o.revisions.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>3. Buyer Revision Requests</span>
                </h3>
                <div className="space-y-2">
                  {o.revisions.map((rev, i) => (
                    <div key={rev.id || i} className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] mb-1">
                        <span className="font-bold text-amber-400">Revision #{i + 1}</span>
                        <span>{rev.requestedAt}</span>
                      </div>
                      <p className="text-slate-200">{rev.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card 4: Real-Time Conversation Log */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>4. Buyer & Freelancer Communication Log</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {workspaceMessages.length} Messages
                </span>
              </div>

              {/* Chat Thread */}
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 border border-slate-800/80 rounded-2xl p-4 bg-slate-900/40">
                {workspaceMessages.map(msg => {
                  const isSystem = msg.senderId === 'system';
                  const isBuyer = msg.senderId === o.buyerId;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center py-1">
                        <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {msg.text} · <span className="text-slate-400">{msg.timestamp}</span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-2 mb-0.5 text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-sm ${
                        isBuyer 
                          ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none' 
                          : 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/30 rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send Chat Message Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={o.isMuted ? 'Chat is muted by Administrator...' : 'Post administrative update into order workspace...'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={o.isMuted}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={o.isMuted || !chatInput.trim()}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Card 5: Admin Private Sticky Notes Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>5. Admin Private Sticky Notes (Staff Only)</span>
                </h3>
                {noteSavedSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                placeholder="Leave internal remarks for yourself or moderation team (e.g. Checked work, approved milestone on phone)..."
                value={adminNoteInput}
                onChange={e => setAdminNoteInput(e.target.value)}
                className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAdminNote}
                  disabled={isSavingNote}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSavingNote ? 'Saving...' : 'Save Private Note'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* RIGHT PANEL (5 / 12 Cols): Money Summary & 3 Big Decision Buttons */}
          {/* =================================================================== */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Money Breakdown Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Financial & Escrow Summary</span>
              </h3>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Order Gross:</span>
                  <span className="font-mono font-black text-xl text-white">${o.amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Platform Commission (10%):</span>
                  <span className="font-mono font-bold text-purple-400">${platformCommission.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Freelancer Net (90%):</span>
                  <span className="font-mono font-bold text-emerald-400">${freelancerNet.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Escrow State:</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] uppercase ${
                    o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    o.status === 'cancelled' ? 'bg-slate-800 text-slate-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {o.status === 'completed' ? 'Funds Released' : o.status === 'cancelled' ? 'Refunded' : 'Locked in Escrow Vault'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Admin Decision Overrides (3 Big Clean Buttons) */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Administrative Actions
              </h3>

              <div className="space-y-2.5">
                {/* Button 1: Approve & Release */}
                <button
                  onClick={handleExecuteReleaseFunds}
                  disabled={o.status === 'completed' || o.status === 'cancelled'}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Release Funds to Freelancer</span>
                </button>

                {/* Button 2: Cancel & Refund */}
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  disabled={o.status === 'completed' || o.status === 'cancelled'}
                  className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cancel Order & Refund Buyer</span>
                </button>

                {/* Button 3: Add More Time */}
                <button
                  onClick={() => setIsExtendModalOpen(true)}
                  disabled={o.status === 'completed' || o.status === 'cancelled'}
                  className="w-full py-3 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Clock className="w-4 h-4" />
                  <span>Add More Time (+2 Days / Custom)</span>
                </button>
              </div>

              {/* Chat Mute Control */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Workspace Chat Privacy:</span>
                <button
                  onClick={handleToggleMute}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    o.isMuted
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {o.isMuted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{o.isMuted ? 'Chat Muted' : 'Mute Chat'}</span>
                </button>
              </div>
            </div>

            {/* 3. Buyer & Seller Details Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Parties Involved
              </h3>

              <div className="space-y-3 text-xs">
                {/* Buyer */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Buyer</span>
                    <span className="font-bold text-white block">{buyer?.name || o.buyerId}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{buyer?.email || 'client@workperhour.com'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    ID #{o.buyerId}
                  </span>
                </div>

                {/* Freelancer */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block">Freelancer</span>
                    <span className="font-bold text-white block">{seller?.name || o.sellerId}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{seller?.email || 'talent@workperhour.com'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    ID #{o.sellerId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Extend Deadline */}
        {isExtendModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Extend Order Deadline</span>
                </h3>
                <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-xs text-slate-400 block">Select Quick Extension:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 5].map(days => (
                    <button
                      key={days}
                      onClick={() => { setExtendDays(days); setExtendCustomDate(''); }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        extendDays === days && !extendCustomDate
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      +{days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Or Pick Specific Date:</label>
                  <input
                    type="date"
                    value={extendCustomDate}
                    onChange={e => setExtendCustomDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reason (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra review time requested by buyer"
                    value={extendReason}
                    onChange={e => setExtendReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteExtendDeadline}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl text-xs font-bold"
                >
                  Confirm Extension
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cancel & Refund */}
        {isRefundModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Cancel Order & Refund Buyer</span>
                </h3>
                <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRefundType('full')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      refundType === 'full'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    100% Full Refund (${o.amount})
                  </button>
                  <button
                    onClick={() => { setRefundType('partial'); setPartialRefundAmount(Math.round(o.amount / 2)); }}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      refundType === 'partial'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Partial Refund
                  </button>
                </div>

                {refundType === 'partial' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Refund Amount ($):</label>
                    <input
                      type="number"
                      max={o.amount}
                      min={1}
                      value={partialRefundAmount}
                      onChange={e => setPartialRefundAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cancellation Reason:</label>
                  <textarea
                    rows={2}
                    placeholder="Enter reason for audit logs and buyer notification..."
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteRefund}
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-bold"
                >
                  Execute Refund
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Upload Deliverable Override */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-emerald-400" />
                  <span>Attach Deliverable File Override</span>
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">File Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. final_corrected_asset_v2.zip"
                    value={uploadFileName}
                    onChange={e => setUploadFileName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estimated Size:</label>
                  <input
                    type="text"
                    value={uploadFileSize}
                    onChange={e => setUploadFileSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteUploadDeliverable}
                  disabled={!uploadFileName.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Attach & Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN ORDERS EXPLORER TABLE & STATUS SUB-TABS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* 1. Status Sub-Tabs Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders', count: counts.all, color: 'text-white' },
            { id: 'active', label: 'Active / In Progress', count: counts.active, color: 'text-blue-400' },
            { id: 'delivered', label: 'Delivered', count: counts.delivered, color: 'text-purple-400' },
            { id: 'completed', label: 'Completed', count: counts.completed, color: 'text-emerald-400' },
            { id: 'revision', label: 'In Revision', count: counts.revision, color: 'text-amber-400' },
            { id: 'disputed', label: 'Disputed', count: counts.disputed, color: 'text-red-400', isAttention: counts.disputed > 0 },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-slate-400' }
          ].map(tab => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 border-slate-700 text-white shadow-md'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  tab.isAttention 
                    ? 'bg-red-500/20 text-red-400 font-extrabold border border-red-500/30 animate-pulse'
                    : isActive 
                    ? 'bg-slate-800 text-emerald-400' 
                    : 'bg-slate-900 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID, Buyer, Freelancer, or Gig Title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={e => setShowOverdueOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-0"
              />
              <span className={showOverdueOnly ? 'text-red-400 font-bold' : ''}>Show Overdue Only</span>
            </label>

            {/* Multi-Select Bulk Actions */}
            {selectedOrderIds.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">{selectedOrderIds.length} selected</span>
                <button
                  onClick={() => {
                    const csvRows = [
                      'Order ID,Title,Amount,Status,Due Date',
                      ...orders
                        .filter(o => selectedOrderIds.includes(o.id))
                        .map(o => `"${o.id}","${o.title}",${o.amount},"${o.status}","${o.dueDate}"`)
                    ];
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `orders_export_${Date.now()}.csv`;
                    a.click();
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedOrderIds(filteredOrders.map(o => o.id));
                      else setSelectedOrderIds([]);
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900"
                  />
                </th>
                <th className="p-4">Order ID & Service</th>
                <th className="p-4">Buyer & Freelancer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadline & Countdown</th>
                <th className="p-4 text-right">Primary Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.map(o => {
                const buyer = users.find(u => u.id === o.buyerId);
                const seller = users.find(u => u.id === o.sellerId);
                const serviceUrl = resolveOrderUrl(o);
                const dueTime = getDueTimeStatus(o.dueDate, o.status);
                const isSelected = selectedOrderIds.includes(o.id);

                return (
                  <tr
                    key={o.id}
                    onClick={() => handleOpenWorkspace(o)}
                    className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                      o.status === 'disputed' ? 'bg-red-950/10' : ''
                    } ${isSelected ? 'bg-slate-900/40' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, o.id]);
                          else setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id));
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900"
                      />
                    </td>

                    {/* Order ID & Service */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => handleCopyId(o.id, e)}
                            className="font-mono text-[11px] font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 inline-flex items-center gap-1"
                            title="Click to copy Order ID"
                          >
                            <span>#{o.id}</span>
                            {copiedId === o.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-500" />
                            )}
                          </button>

                          <a
                            href={serviceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-slate-400 hover:text-emerald-400 p-0.5 rounded"
                            title="Open Gig Webpage in New Tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <span className="font-bold text-white block max-w-xs truncate" title={o.title}>
                          {o.title}
                        </span>
                      </div>
                    </td>

                    {/* Buyer & Freelancer */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Buyer:</span>
                          <span className="font-semibold text-slate-200">{buyer?.name || o.buyerId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold">Seller:</span>
                          <span className="font-semibold text-emerald-300">{seller?.name || o.sellerId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <span className="font-mono font-black text-white text-sm">
                        ${o.amount.toFixed(2)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        o.status === 'disputed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        o.status === 'delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        o.status === 'revision' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Deadline Countdown */}
                    <td className="p-4 font-mono text-xs">
                      <span className={`block font-bold ${dueTime.color}`}>
                        {dueTime.text}
                      </span>
                      <span className="text-[10px] text-slate-500">Due: {o.dueDate}</span>
                    </td>

                    {/* Primary Action Button */}
                    <td className="p-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenWorkspace(o);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No orders found matching the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
