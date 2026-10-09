import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, Search, Star, ShieldCheck, Clock, DollarSign, Send, 
  MessageSquare, User, PlusCircle, CheckCircle2, AlertCircle, 
  Sparkles, Award, ArrowRight, ChevronRight, Filter, Globe, Lock, Check, RefreshCw, ArrowLeft,
  Settings, Users, Layers, TrendingUp, AlertTriangle, Eye, Trash2, CheckCircle, BarChart3,
  LayoutDashboard, ShieldAlert, Sliders, LogOut, FileText, Activity, Wallet, Scale, CornerDownLeft,
  HelpCircle, Flag, MessageCircle, FileCode, KeyRound, Shield, ExternalLink
} from 'lucide-react';
import { UserWalletsLedgerModule } from './components/UserWalletsLedgerModule';
import { AdminOrdersManager } from './components/AdminOrdersManager';

interface GigExtra {
  id: string;
  title: string;
  price: number;
}

interface Gig {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerUsername?: string;
  freelancerAvatar: string;
  freelancerLevel?: string;
  title: string;
  slug?: string;
  category: string;
  subcategory?: string;
  description: string;
  price: number;
  deliveryDays: number;
  rating: number;
  reviewsCount: number;
  image: string;
  status: 'published' | 'draft' | 'suspended';
  featured: boolean;
  extras?: GigExtra[];
  moderationStatus?: 'approved' | 'flagged' | 'rejected' | 'pending';
  moderationNotes?: string;
}

interface Project {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  title: string;
  slug?: string;
  category: string;
  subcategory?: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadlineDays: number;
  proposalsCount: number;
  createdAt: string;
  status: 'open' | 'published' | 'unpublished' | 'suspended' | 'in_progress' | 'completed';
  featured: boolean;
  moderationStatus?: 'approved' | 'flagged' | 'rejected' | 'pending';
  moderationNotes?: string;
}

interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerTitle: string;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Order {
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

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  title: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  earned: number;
  completedJobs: number;
  bio: string;
  skills: string[];
  status: 'active' | 'suspended' | 'restricted';
  verified: boolean;
  walletBalance: number;
  createdAt: string;
}

interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  evidence: string;
  status: 'open' | 'under_investigation' | 'resolved_refund' | 'resolved_release' | 'resolved_partial';
  createdAt: string;
  resolutionNotes?: string;
  assignedTo?: string;
}

interface Refund {
  id: string;
  orderId: string;
  buyerId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Payout {
  id: string;
  freelancerId: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'processed' | 'failed' | 'cancelled' | 'reversed';
  createdAt: string;
  accountDetails: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  order: number;
  subcategories: { id: string; name: string; slug: string; enabled: boolean }[];
}

interface Review {
  id: string;
  orderId: string;
  reviewerName: string;
  reviewerAvatar: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  messages: { sender: string; text: string; timestamp: string }[];
}

interface AuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface UserEmail {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  body: string;
  type: 'SUSPEND' | 'RESTRICT' | 'IMPERSONATE' | 'GENERAL';
  sentAt: string;
  read: boolean;
}

const CATEGORY_SLUGS: Record<string, string> = {
  'All': 'all',
  'Development & IT': 'development-it',
  'AI & Data': 'ai-data',
  'Design & Creative': 'design-creative',
  'Mobile Apps': 'mobile-apps'
};

const SLUG_TO_CATEGORY: Record<string, string> = {
  'all': 'All',
  'development-it': 'Development & IT',
  'ai-data': 'AI & Data',
  'design-creative': 'Design & Creative',
  'mobile-apps': 'Mobile Apps'
};

export default function App() {
  // Routing
  const [path, setPath] = useState<string>(window.location.pathname === '/' ? '/gigs' : window.location.pathname);
  
  // Impersonation State
  const [impersonatedUser, setImpersonatedUser] = useState<UserAccount | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount>({
    id: 'user_1',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    title: 'Senior Full-Stack Architect & Product Specialist',
    rating: 4.9,
    reviewsCount: 142,
    hourlyRate: 85,
    earned: 48500,
    completedJobs: 165,
    bio: 'Product engineer building scalable SaaS apps.',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    status: 'active',
    verified: true,
    walletBalance: 4250,
    createdAt: '2025-01-15'
  });

  // Data states
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [serviceOptionFilter, setServiceOptionFilter] = useState<string>('All');
  const [sellerLevelFilter, setSellerLevelFilter] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<string>('All');
  const [deliveryTimeFilter, setDeliveryTimeFilter] = useState<number | null>(null);
  const [proServicesOnly, setProServicesOnly] = useState<boolean>(false);
  const [onlineNowOnly, setOnlineNowOnly] = useState<boolean>(false);

  // Proposal & Creation states
  const [proposalBid, setProposalBid] = useState('');
  const [proposalDays, setProposalDays] = useState('');
  const [proposalCover, setProposalCover] = useState('');
  const [isGeneratingAIProposal, setIsGeneratingAIProposal] = useState(false);

  const [newGigTitle, setNewGigTitle] = useState('');
  const [newGigCat, setNewGigCat] = useState('Development & IT');
  const [newGigDesc, setNewGigDesc] = useState('');
  const [newGigPrice, setNewGigPrice] = useState(450);
  const [newGigDays, setNewGigDays] = useState(5);
  const [isOptimizingGig, setIsOptimizingGig] = useState(false);

  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjCat, setNewProjCat] = useState('Development & IT');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjMin, setNewProjMin] = useState(500);
  const [newProjMax, setNewProjMax] = useState(2000);

  // Active chat order selection
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Admin Module Navigation (20 Modules)
  const [adminTab, setAdminTab] = useState<
    'overview' | 'users' | 'projects' | 'gigs' | 'categories' | 
    'proposals' | 'contracts' | 'payments' | 'wallet' | 'escrow' | 
    'disputes' | 'refunds' | 'payouts' | 'reviews' | 'messages' | 
    'reports' | 'support' | 'cms' | 'settings' | 'security' | 'activity' | 'orders'
  >('overview');

  const [platformFee, setPlatformFee] = useState<number>(10);
  const [escrowProtectionDays, setEscrowProtectionDays] = useState<number>(14);
  const [ticketReplyText, setTicketReplyText] = useState<string>('');
  const [disputeNotesText, setDisputeNotesText] = useState<string>('');

  // Activity Audit Log Search & Filter
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityActionFilter, setActivityActionFilter] = useState('all');

  // User Notifications & Support Desk Modal State
  const [userEmails, setUserEmails] = useState<UserEmail[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'restricted'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userVerifiedFilter, setUserVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  
  // Inspect & Edit User Modals
  const [inspectingUser, setInspectingUser] = useState<UserAccount | null>(null);
  const [userActivityTab, setUserActivityTab] = useState<'overview' | 'gigs' | 'projects' | 'proposals' | 'orders' | 'reviews' | 'tickets'>('overview');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: 'user',
    title: '',
    bio: '',
    skills: '',
    hourlyRate: 0,
    walletBalance: 0,
    verified: false,
    status: 'active'
  });
  
  // Category & Subcategory Management State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [addingSubForCatId, setAddingSubForCatId] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubId, setEditingSubId] = useState<{ catId: string; subId: string } | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedSubPairs, setSelectedSubPairs] = useState<{ catId: string; subId: string }[]>([]);

  // Admin Projects Management State
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'open' | 'published' | 'unpublished' | 'suspended' | 'in_progress' | 'completed'>('all');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('all');
  const [projectFeaturedFilter, setProjectFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all');

  // Modals & Drawers for Projects Management
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectForm, setEditProjectForm] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    deadlineDays: 14,
    status: 'open' as Project['status'],
    featured: false
  });
  const [moderatingProject, setModeratingProject] = useState<Project | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [moderationStatus, setModerationStatus] = useState<'approved' | 'flagged' | 'rejected' | 'pending'>('approved');

  // Admin Gigs Management State
  const [gigSearchQuery, setGigSearchQuery] = useState('');
  const [gigStatusFilter, setGigStatusFilter] = useState<'all' | 'published' | 'draft' | 'suspended'>('all');
  const [gigCategoryFilter, setGigCategoryFilter] = useState('all');
  const [gigFeaturedFilter, setGigFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all');

  // Modals & Drawers for Gigs Management
  const [viewingGig, setViewingGig] = useState<Gig | null>(null);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [editGigForm, setEditGigForm] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    price: 0,
    deliveryDays: 1,
    status: 'published' as Gig['status'],
    featured: false
  });
  const [moderatingGig, setModeratingGig] = useState<Gig | null>(null);
  const [gigModerationNotes, setGigModerationNotes] = useState('');
  const [gigModerationStatus, setGigModerationStatus] = useState<'approved' | 'flagged' | 'rejected' | 'pending'>('approved');
  
  // Admin Proposals Management State
  const [proposalSearchQuery, setProposalSearchQuery] = useState('');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [proposalSort, setProposalSort] = useState<'newest' | 'bid_high' | 'bid_low'>('newest');
  const [proposalBidMinFilter, setProposalBidMinFilter] = useState('');
  const [proposalBidMaxFilter, setProposalBidMaxFilter] = useState('');
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [editProposalForm, setEditProposalForm] = useState({
    bidAmount: 0,
    deliveryDays: 1,
    coverLetter: '',
    status: 'pending' as Proposal['status']
  });

  // Admin Orders Management State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'funded_in_escrow' | 'in_progress' | 'delivered' | 'completed' | 'disputed'>('all');
  const [orderGigFilter, setOrderGigFilter] = useState('all');
  const [orderProjectFilter, setOrderProjectFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [associatingOrder, setAssociatingOrder] = useState<Order | null>(null);
  const [linkTargetType, setLinkTargetType] = useState<'gig' | 'project'>('gig');
  const [linkTargetId, setLinkTargetId] = useState('');

  // Gig Extras state
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [newGigExtras, setNewGigExtras] = useState<{ id: string; title: string; price: number }[]>([
    { id: 'ext_fast', title: 'Extra Fast Express Delivery', price: 100 }
  ]);
  const [extraTitleInput, setExtraTitleInput] = useState('');
  const [extraPriceInput, setExtraPriceInput] = useState(50);

  const wsRef = useRef<WebSocket | null>(null);

  const handleAddGigExtra = () => {
    if (!extraTitleInput.trim() || extraPriceInput <= 0) return;
    setNewGigExtras(prev => [
      ...prev,
      { id: 'ext_' + Date.now(), title: extraTitleInput.trim(), price: Number(extraPriceInput) }
    ]);
    setExtraTitleInput('');
    setExtraPriceInput(50);
  };

  const handleRemoveGigExtra = (id: string) => {
    setNewGigExtras(prev => prev.filter(e => e.id !== id));
  };

  // Helper function to create URL slugs
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Get Fiverr-style clean URL for a gig: /:username/:slug
  const getGigUrl = (gig: Gig) => {
    const uname = (gig.freelancerUsername || slugify(gig.freelancerName)).toLowerCase();
    const gslug = (gig.slug || slugify(gig.title)).toLowerCase();
    return `/${uname}/${gslug}`;
  };

  // Get clean URL for a project: /project/:slug
  const getProjectUrl = (project: Project) => {
    const pslug = (project.slug || slugify(project.title)).toLowerCase();
    return `/project/${pslug}`;
  };

  // Sync pathname route
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({}, '', '/gigs');
      setPath('/gigs');
    }
    const handlePopState = () => {
      setPath(window.location.pathname || '/gigs');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch initial data
  useEffect(() => {
    fetchAllAdminData();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MESSAGE_RECEIVED') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const safeJson = async (res: Response, fallback: any = []) => {
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return fallback;
    try {
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const fetchUserEmails = async (userId: string) => {
    try {
      const res = await fetch(`/api/user-emails/${userId}`);
      const data = await safeJson(res, []);
      setUserEmails(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const activeUserId = impersonatedUser ? impersonatedUser.id : currentUser.id;
    fetchUserEmails(activeUserId);
  }, [impersonatedUser]);

  const fetchAllAdminData = async () => {
    try {
      const activeUserId = impersonatedUser ? impersonatedUser.id : currentUser.id;
      fetchUserEmails(activeUserId);
      const [uRes, gRes, pRes, prRes, oRes, dRes, rRes, payRes, cRes, revRes, sRes, aRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/gigs'),
        fetch('/api/projects'),
        fetch('/api/proposals'),
        fetch('/api/orders'),
        fetch('/api/disputes'),
        fetch('/api/refunds'),
        fetch('/api/payouts'),
        fetch('/api/categories'),
        fetch('/api/reviews'),
        fetch('/api/support-tickets'),
        fetch('/api/audit-logs')
      ]);

      const usersData = await safeJson(uRes, []);
      const gigsData = await safeJson(gRes, []);
      const projectsData = await safeJson(pRes, []);
      const proposalsData = await safeJson(prRes, []);
      const ords = await safeJson(oRes, []);
      const disputesData = await safeJson(dRes, []);
      const refundsData = await safeJson(rRes, []);
      const payoutsData = await safeJson(payRes, []);
      const categoriesData = await safeJson(cRes, []);
      const reviewsData = await safeJson(revRes, []);
      const supportTicketsData = await safeJson(sRes, []);
      const auditLogsData = await safeJson(aRes, []);

      if (usersData.length > 0) setUsersList(usersData);
      if (gigsData.length > 0) setGigs(gigsData);
      if (projectsData.length > 0) setProjects(projectsData);
      if (proposalsData.length > 0) setProposals(proposalsData);
      if (ords.length > 0) {
        setOrders(ords);
        if (!selectedOrder) {
          setSelectedOrder(ords[0]);
          fetchMessages(ords[0].id);
        }
      }
      if (disputesData.length > 0) setDisputes(disputesData);
      if (refundsData.length > 0) setRefunds(refundsData);
      if (payoutsData.length > 0) setPayouts(payoutsData);
      if (categoriesData.length > 0) setCategories(categoriesData);
      if (reviewsData.length > 0) setReviews(reviewsData);
      if (supportTicketsData.length > 0) setSupportTickets(supportTicketsData);
      if (auditLogsData.length > 0) setAuditLogs(auditLogsData);
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  };

  const fetchMessages = async (orderId: string) => {
    try {
      const res = await fetch(`/api/messages/${orderId}`);
      const data = await safeJson(res, []);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactSeller = async (sellerId: string, sellerName: string, gigTitle: string) => {
    // 1. Search for existing conversation with this seller
    let existingOrder = orders.find(o => o.sellerId === sellerId || o.buyerId === sellerId);
    
    if (existingOrder) {
      setSelectedOrder(existingOrder);
      await fetchMessages(existingOrder.id);
    } else {
      // 2. Create an inquiry conversation thread and send initial greeting message
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Inquiry: ${gigTitle}`,
            buyerId: impersonatedUser ? impersonatedUser.id : currentUser.id,
            sellerId: sellerId,
            amount: 0,
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
          })
        });
        const newChatOrd = await res.json();
        setOrders(prev => [newChatOrd, ...prev]);
        setSelectedOrder(newChatOrd);

        // Send initial inquiry message
        const initText = `Hi ${sellerName}, I am interested in your gig: "${gigTitle}". Let's discuss details!`;
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newChatOrd.id,
            senderId: impersonatedUser ? impersonatedUser.id : currentUser.id,
            senderName: impersonatedUser ? impersonatedUser.name : currentUser.name,
            text: initText
          })
        });
        await fetchMessages(newChatOrd.id);
      } catch (err) {
        console.error('Error creating contact chat:', err);
      }
    }

    // 3. Navigate directly to Live Chat view
    navigate('/messages');
  };

  // Category Management Handlers
  const handleToggleCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}/toggle`, { method: 'PATCH' });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubcategory = async (catId: string, subId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}/subcategories/${subId}/toggle`, { method: 'PATCH' });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDeleteCategories = async () => {
    const totalCount = selectedCatIds.length + selectedSubPairs.length;
    if (totalCount === 0) return;
    if (!confirm(`Are you sure you want to bulk delete ${totalCount} selected items?`)) return;

    try {
      const res = await fetch('/api/admin/categories/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryIds: selectedCatIds,
          subcategoryPairs: selectedSubPairs
        })
      });
      const data = await safeJson(res, null);
      if (data) {
        setCategories(data);
        setSelectedCatIds([]);
        setSelectedSubPairs([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), slug: newCategorySlug.trim() })
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
      setNewCategoryName('');
      setNewCategorySlug('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName.trim(), slug: editCatSlug.trim() })
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
      setEditingCatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}" and its subcategories?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'DELETE'
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubcategory = async (catId: string) => {
    if (!newSubcategoryName.trim()) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubcategoryName.trim() })
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
      setAddingSubForCatId(null);
      setNewSubcategoryName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubcategory = async (catId: string, subId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}/subcategories/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSubName.trim() })
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
      setEditingSubId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubcategory = async (catId: string, subId: string, subName: string) => {
    if (!confirm(`Delete subcategory "${subName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}/subcategories/${subId}`, {
        method: 'DELETE'
      });
      const data = await safeJson(res, null);
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Impersonation handlers
  const handleStartImpersonation = async (user: UserAccount) => {
    try {
      await fetch(`/api/admin/users/${user.id}/impersonate`, { method: 'POST' });
      setImpersonatedUser(user);
      fetchUserEmails(user.id);
      fetchAllAdminData();
      alert(`Started Super Admin Impersonation of ${user.name}. Security notice sent via chat and email.`);
      navigate('/gigs');
    } catch (e) {
      console.error(e);
      setImpersonatedUser(user);
      navigate('/gigs');
    }
  };

  const handleStopImpersonation = async () => {
    if (impersonatedUser) {
      try {
        await fetch(`/api/admin/users/${impersonatedUser.id}/stop-impersonate`, { method: 'POST' });
      } catch (err) {
        console.error('Error stopping impersonation on backend:', err);
      }
    }
    setImpersonatedUser(null);
    fetchUserEmails(currentUser.id);
    fetchAllAdminData();
    alert('Impersonation ended. Returned to Admin Console.');
    navigate('/admin');
  };

  const handleOpenEditUserModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      title: user.title || '',
      bio: user.bio || '',
      skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
      hourlyRate: user.hourlyRate || 0,
      walletBalance: user.walletBalance || 0,
      verified: !!user.verified,
      status: user.status || 'active'
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      });
      const updated = await res.json();
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? updated : u));
      if (inspectingUser?.id === editingUser.id) setInspectingUser(updated);
      setEditingUser(null);
      alert(`Updated user profile for ${updated.name}`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, { method: 'PATCH' });
      const updated = await res.json();
      setUsersList(prev => prev.map(u => u.id === id ? updated : u));
      if (inspectingUser?.id === id) setInspectingUser(updated);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserStatusToggle = async (id: string, newStatus: 'active' | 'suspended' | 'restricted') => {
    try {
      const targetUser = usersList.find(u => u.id === id);
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setUsersList(prev => prev.map(u => u.id === id ? updated : u));
      if (inspectingUser?.id === id) setInspectingUser(updated);
      if (newStatus === 'suspended' || newStatus === 'restricted') {
        alert(`User ${targetUser?.name || id} status changed to ${newStatus.toUpperCase()}. Automated Chat message and Email notification dispatched asking to contact support.`);
      } else {
        alert(`User ${targetUser?.name || id} activated successfully.`);
      }
      fetchAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account? All associated freelance gigs and buyer project postings will also be deleted. This action is irreversible.')) return;
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsersList(prev => prev.filter(u => u.id !== userId));
      if (inspectingUser?.id === userId) setInspectingUser(null);
      alert('User account and all associated listings permanently deleted.');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Projects Management Handlers
  const handleUpdateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      if (viewingProject?.id === projectId) setViewingProject(updated);
      if (editingProject?.id === projectId) setEditingProject(updated);
      if (moderatingProject?.id === projectId) setModeratingProject(updated);
      alert(`Project status updated to "${newStatus.toUpperCase()}".`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProjectFeature = async (projectId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/feature`, { method: 'PATCH' });
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      if (viewingProject?.id === projectId) setViewingProject(updated);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditProjectModal = (p: Project) => {
    setEditingProject(p);
    setEditProjectForm({
      title: p.title || '',
      category: p.category || 'Development & IT',
      subcategory: p.subcategory || '',
      description: p.description || '',
      budgetMin: p.budgetMin || 0,
      budgetMax: p.budgetMax || 0,
      deadlineDays: p.deadlineDays || 14,
      status: p.status || 'open',
      featured: !!p.featured
    });
  };

  const handleSaveEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const res = await fetch(`/api/admin/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProjectForm)
      });
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
      setEditingProject(null);
      alert(`Project "${updated.title}" updated successfully.`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModerationModal = (p: Project) => {
    setModeratingProject(p);
    setModerationStatus(p.moderationStatus || 'approved');
    setModerationNotes(p.moderationNotes || '');
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingProject) return;
    try {
      const res = await fetch(`/api/admin/projects/${moderatingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationStatus,
          moderationNotes
        })
      });
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === moderatingProject.id ? updated : p));
      setModeratingProject(null);
      alert(`Moderation review recorded for project "${updated.title}".`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await fetch(`/api/admin/projects/${projectId}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (viewingProject?.id === projectId) setViewingProject(null);
      alert('Project deleted successfully.');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Gigs / Services Management Handlers
  const handleUpdateGigStatus = async (gigId: string, newStatus: Gig['status']) => {
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setGigs(prev => prev.map(g => g.id === gigId ? updated : g));
      if (viewingGig?.id === gigId) setViewingGig(updated);
      alert(`Service status updated to "${newStatus.toUpperCase()}".`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleGigFeature = async (gigId: string) => {
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/feature`, { method: 'PATCH' });
      const updated = await res.json();
      setGigs(prev => prev.map(g => g.id === gigId ? updated : g));
      if (viewingGig?.id === gigId) setViewingGig(updated);
      alert(`Service featured status toggled!`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditGigModal = (g: Gig) => {
    setEditingGig(g);
    setEditGigForm({
      title: g.title || '',
      category: g.category || 'Development & IT',
      subcategory: g.subcategory || '',
      description: g.description || '',
      price: g.price || 0,
      deliveryDays: g.deliveryDays || 1,
      status: g.status || 'published',
      featured: !!g.featured
    });
  };

  const handleSaveEditGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGig) return;
    try {
      const res = await fetch(`/api/admin/gigs/${editingGig.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGigForm)
      });
      const updated = await res.json();
      setGigs(prev => prev.map(g => g.id === editingGig.id ? updated : g));
      setEditingGig(null);
      alert(`Service "${updated.title}" updated successfully.`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenGigModerationModal = (g: Gig) => {
    setModeratingGig(g);
    setGigModerationStatus(g.moderationStatus || 'approved');
    setGigModerationNotes(g.moderationNotes || '');
  };

  const handleSaveGigModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingGig) return;
    try {
      const res = await fetch(`/api/admin/gigs/${moderatingGig.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationStatus: gigModerationStatus,
          moderationNotes: gigModerationNotes
        })
      });
      const updated = await res.json();
      setGigs(prev => prev.map(g => g.id === moderatingGig.id ? updated : g));
      setModeratingGig(null);
      alert(`Moderation review recorded for service/gig "${updated.title}".`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to permanently delete this freelancer service/gig? This action is irreversible.')) return;
    try {
      await fetch(`/api/admin/gigs/${gigId}`, { method: 'DELETE' });
      setGigs(prev => prev.filter(g => g.id !== gigId));
      if (viewingGig?.id === gigId) setViewingGig(null);
      alert('Service/Gig deleted successfully.');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditProposalModal = (p: Proposal) => {
    setEditingProposal(p);
    setEditProposalForm({
      bidAmount: p.bidAmount,
      deliveryDays: p.deliveryDays,
      coverLetter: p.coverLetter,
      status: p.status
    });
  };

  const handleSaveEditProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    try {
      const res = await fetch(`/api/admin/proposals/${editingProposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProposalForm)
      });
      const updated = await res.json();
      setProposals(prev => prev.map(p => p.id === editingProposal.id ? updated : p));
      setEditingProposal(null);
      alert(`Proposal #${updated.id} updated successfully.`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, newStatus: Proposal['status']) => {
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setProposals(prev => prev.map(p => p.id === proposalId ? updated : p));
      alert(`Proposal status updated to ${newStatus}.`);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to permanently delete this proposal? This action is irreversible.')) return;
    try {
      await fetch(`/api/admin/proposals/${proposalId}`, { method: 'DELETE' });
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      if (viewingProposal?.id === proposalId) setViewingProposal(null);
      alert('Proposal deleted successfully.');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    const activeUser = impersonatedUser || currentUser;
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          userName: activeUser.name,
          subject: supportSubject.trim(),
          text: supportMessage.trim(),
          priority: 'high'
        })
      });
      const newTicket = await res.json();
      setSupportTickets(prev => [newTicket, ...prev]);
      setIsSupportModalOpen(false);
      setSupportSubject('');
      setSupportMessage('');
      alert('Support ticket created successfully! WorkSphere Support Staff will review your inquiry.');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveDispute = async (id: string, resolutionStatus: string) => {
    try {
      const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolutionStatus, notes: disputeNotesText || 'Resolved by Super Admin.' })
      });
      const updated = await res.json();
      setDisputes(prev => prev.map(d => d.id === id ? updated : d));
      setDisputeNotesText('');
      alert(`Dispute #${id} resolved successfully.`);
      fetchAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupportReply = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ticketReplyText })
      });
      const updated = await res.json();
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      setTicketReplyText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/approve`, { method: 'PATCH' });
      const updated = await res.json();
      setPayouts(prev => prev.map(p => p.id === payoutId ? updated : p));
      fetchAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };
  const handleProcessPayout = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/process`, { method: 'PATCH' });
      const updated = await res.json();
      setPayouts(prev => prev.map(p => p.id === payoutId ? updated : p));
      fetchAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };
  const handleFailPayout = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/fail`, { method: 'PATCH' });
      const updated = await res.json();
      setPayouts(prev => prev.map(p => p.id === payoutId ? updated : p));
      fetchAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrder = async (title: string, amount: number, sellerId: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          buyerId: impersonatedUser ? impersonatedUser.id : currentUser.id,
          sellerId,
          amount,
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
        })
      });
      const newOrd = await res.json();
      setOrders(prev => [newOrd, ...prev]);
      setSelectedOrder(newOrd);
      fetchMessages(newOrd.id);
      navigate('/orders');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedOrder || !wsRef.current) return;

    const payload = {
      type: 'NEW_MESSAGE',
      orderId: selectedOrder.id,
      senderId: impersonatedUser ? impersonatedUser.id : currentUser.id,
      senderName: impersonatedUser ? impersonatedUser.name : currentUser.name,
      text: newMessageText
    };

    wsRef.current.send(JSON.stringify(payload));
    setNewMessageText('');
  };

  const handleGenerateAIProposal = async (projectTitle: string, projectDesc: string) => {
    setIsGeneratingAIProposal(true);
    try {
      const res = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          projectDescription: projectDesc,
          freelancerTitle: currentUser.title,
          freelancerSkills: ['React', 'TypeScript', 'Node.js', 'UI/UX']
        })
      });
      const data = await res.json();
      if (data.proposal) {
        setProposalCover(data.proposal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAIProposal(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    try {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          freelancerId: impersonatedUser ? impersonatedUser.id : currentUser.id,
          freelancerName: impersonatedUser ? impersonatedUser.name : currentUser.name,
          freelancerAvatar: impersonatedUser ? impersonatedUser.avatar : currentUser.avatar,
          freelancerTitle: currentUser.title,
          coverLetter: proposalCover,
          bidAmount: Number(proposalBid),
          deliveryDays: Number(proposalDays)
        })
      });
      alert('Proposal submitted successfully!');
      navigate('/projects');
      setProposalCover('');
      setProposalBid('');
      setProposalDays('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptimizeGigWithAI = async () => {
    if (!newGigTitle || !newGigDesc) {
      alert('Please enter a title and description first.');
      return;
    }
    setIsOptimizingGig(true);
    try {
      const res = await fetch('/api/ai/optimize-gig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newGigTitle, description: newGigDesc })
      });
      const data = await res.json();
      if (data.optimizedTitle) setNewGigTitle(data.optimizedTitle);
      if (data.optimizedDescription) setNewGigDesc(data.optimizedDescription);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizingGig(false);
    }
  };

  const handlePublishGig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerId: impersonatedUser ? impersonatedUser.id : currentUser.id,
          freelancerName: impersonatedUser ? impersonatedUser.name : currentUser.name,
          freelancerAvatar: impersonatedUser ? impersonatedUser.avatar : currentUser.avatar,
          freelancerLevel: 'Level 1 ★',
          title: newGigTitle,
          category: newGigCat,
          description: newGigDesc,
          price: Number(newGigPrice),
          deliveryDays: Number(newGigDays),
          image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
          status: 'published',
          featured: false,
          extras: newGigExtras
        })
      });
      alert('Gig published successfully!');
      navigate('/gigs');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: impersonatedUser ? impersonatedUser.id : currentUser.id,
          buyerName: impersonatedUser ? impersonatedUser.name : currentUser.name,
          buyerAvatar: impersonatedUser ? impersonatedUser.avatar : currentUser.avatar,
          title: newProjTitle,
          category: newProjCat,
          description: newProjDesc,
          budgetMin: Number(newProjMin),
          budgetMax: Number(newProjMax),
          deadlineDays: 14,
          featured: false
        })
      });
      alert('Project posted successfully!');
      navigate('/projects');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Reserved top-level route segments
  const reservedRoutes = ['gigs', 'projects', 'categories', 'orders', 'messages', 'create-gig', 'post-project', 'admin'];

  // Route matching
  const pathParts = path.split('/').filter(Boolean);

  const isCategoryRoute = path.startsWith('/categories/');
  const categorySlug = isCategoryRoute ? path.replace('/categories/', '') : null;
  const currentCategory = categorySlug ? (SLUG_TO_CATEGORY[categorySlug] || 'All') : 'All';

  const isProjectsList = path === '/projects';
  const isOrders = path === '/orders';
  const isMessages = path === '/messages';
  const isCreateGig = path === '/create-gig';
  const isPostProject = path === '/post-project';
  const isAdmin = path === '/admin';

  // Gig detail route check: Fiverr style /:username/:slug OR /gigs/:id
  let currentGig: Gig | undefined = undefined;
  let isGigDetail = false;

  if (pathParts.length === 2 && !reservedRoutes.includes(pathParts[0].toLowerCase())) {
    const usernameParam = pathParts[0].toLowerCase();
    const slugParam = pathParts[1].toLowerCase();

    currentGig = gigs.find(g => {
      const gigUsername = (g.freelancerUsername || slugify(g.freelancerName)).toLowerCase();
      const gigSlug = (g.slug || slugify(g.title)).toLowerCase();
      return (gigUsername === usernameParam || usernameParam === 'broadcastking') && 
             (gigSlug === slugParam || g.id === slugParam || slugParam.includes(gigSlug.slice(0, 15)));
    });

    if (currentGig) {
      isGigDetail = true;
    }
  } else if (path.startsWith('/gigs/') && path.length > 6) {
    const gigIdParam = path.replace('/gigs/', '').toLowerCase();
    currentGig = gigs.find(g => g.id === gigIdParam || (g.slug && g.slug.toLowerCase() === gigIdParam));
    if (currentGig) {
      isGigDetail = true;
    }
  }

  const isGigsList = (path === '/gigs' || path === '/' || isCategoryRoute) && !isGigDetail;

  // Project proposal route check: /projects/:id
  const isProjectDetail = path.startsWith('/projects/') && path.length > 10;
  const projIdParam = isProjectDetail ? path.replace('/projects/', '') : null;
  const currentProject = projects.find(p => p.id === projIdParam);

  // Filtered Gigs computation
  const filteredGigs = gigs.filter(g => {
    const matchesCat = currentCategory === 'All' || g.category === currentCategory;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesServiceOpt = serviceOptionFilter === 'All' || g.category === serviceOptionFilter;
    const matchesSellerLevel = sellerLevelFilter === 'All' || (g.freelancerLevel && g.freelancerLevel.includes(sellerLevelFilter));
    const matchesBudget = budgetFilter === 'All' 
      ? true 
      : budgetFilter === 'under_500' ? g.price <= 500
      : budgetFilter === '500_1000' ? g.price > 500 && g.price <= 1000
      : g.price > 1000;
    const matchesDelivery = deliveryTimeFilter === null || g.deliveryDays <= deliveryTimeFilter;
    const matchesOnline = !onlineNowOnly || true;

    return matchesCat && matchesSearch && matchesServiceOpt && matchesSellerLevel && matchesBudget && matchesDelivery && matchesOnline;
  });

  // Dedicated Admin Panel View with 20 Comprehensive Modules & Sidebar
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
        {/* ADMIN SIDEBAR */}
        <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-5 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div>
            {/* Admin Brand */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
              <a href="/gigs" onClick={(e) => navigate('/gigs', e)} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-md">
                  W
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white block leading-none">WorkPerHour</span>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Super Admin Suite</span>
                </div>
              </a>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">v3.0 RBAC</span>
            </div>

            {/* Sidebar Navigation: 20 Enterprise Admin Modules */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: '1. Dashboard Overview', icon: LayoutDashboard },
                { id: 'users', label: '2. User Management', icon: Users },
                { id: 'projects', label: '3. Projects & RFPs', icon: Briefcase },
                { id: 'gigs', label: '4. Services & Gigs', icon: Layers },
                { id: 'orders', label: '5. All Orders', icon: Shield },
                { id: 'categories', label: '6. Categories & Slugs', icon: Sliders },
                { id: 'proposals', label: '7. Proposals & Bids', icon: FileText },
                { id: 'contracts', label: '8. Contracts & Milestones', icon: CheckCircle2 },
                { id: 'payments', label: '9. Payment Gateways', icon: DollarSign },
                { id: 'wallet', label: '10. Wallet & Double Ledger', icon: Wallet },
                { id: 'escrow', label: '11. Escrow Vault (14-Day)', icon: ShieldCheck },
                { id: 'disputes', label: '12. Dispute Resolution', icon: Scale },
                { id: 'refunds', label: '13. Refund Requests', icon: CornerDownLeft },
                { id: 'payouts', label: '14. Freelancer Payouts', icon: TrendingUp },
                { id: 'reviews', label: '15. Reviews & Moderation', icon: Star },
                { id: 'messages', label: '16. Messages & Chat Audit', icon: MessageCircle },
                { id: 'reports', label: '17. Flagged Reports', icon: Flag },
                { id: 'support', label: '18. Support Ticket Desk', icon: HelpCircle },
                { id: 'cms', label: '19. CMS & Legal Policies', icon: FileCode },
                { id: 'settings', label: '20. Site & Fee Settings', icon: Settings },
                { id: 'activity', label: '21. Activity & Audit Trail', icon: Activity }
              ].map(item => {
                const IconComp = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System Status & Exit */}
          <div className="space-y-4 pt-6 border-t border-slate-800 mt-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gateway Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">RBAC Active · 14-Day Escrow Locked</p>
            </div>

            <a 
              href="/gigs" 
              onClick={(e) => navigate('/gigs', e)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4 text-emerald-400" />
              <span>Exit Admin Portal</span>
            </a>
          </div>
        </aside>

        {/* MAIN ADMIN CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-1">Super Administrator Console</span>
              <h1 className="text-2xl font-extrabold text-white">
                {adminTab === 'overview' && '1. Admin Dashboard & Metrics'}
                {adminTab === 'users' && '2. User Management & Impersonation'}
                {adminTab === 'projects' && '3. Projects & RFP Moderation'}
                {adminTab === 'gigs' && '4. Services & Gigs Management'}
                {adminTab === 'orders' && '5. All Orders Management'}
                {adminTab === 'categories' && '6. Categories, Subcategories & Slugs'}
                {adminTab === 'proposals' && '7. Proposals & Bid Audit'}
                {adminTab === 'contracts' && '8. Contracts & Milestone Timelines'}
                {adminTab === 'payments' && '9. Payments & Razorpay/Stripe Logs'}
                {adminTab === 'wallet' && '10. User Wallets & Double-Entry Ledger'}
                {adminTab === 'escrow' && '11. Escrow Management (Mandatory 14-Day Protection)'}
                {adminTab === 'disputes' && '12. Dispute Investigation & Resolution'}
                {adminTab === 'refunds' && '13. Refund Requests & Approvals'}
                {adminTab === 'payouts' && '14. Freelancer Payouts & Disbursements'}
                {adminTab === 'reviews' && '15. Reviews & Ratings Moderation'}
                {adminTab === 'messages' && '16. Messages & Conversation Audit'}
                {adminTab === 'reports' && '17. Flagged Reports & Cases'}
                {adminTab === 'support' && '18. Support Ticket Help Desk'}
                {adminTab === 'cms' && '19. CMS Pages & Legal Policies'}
                {adminTab === 'settings' && '20. Site & Fee Settings'}
                {(adminTab === 'security' || adminTab === 'activity') && '21. Admin Activity Logs & Security Audit Trail'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
                RBAC Level: Super Admin
              </span>
            </div>
          </div>

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {adminTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escrow Balance</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    ${orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Mandatory 14-Day Protection Active</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{usersList.length}</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Verified Buyers & Sellers</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disputes Open</span>
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400">{disputes.length}</div>
                  <span className="text-[11px] text-amber-400 font-semibold mt-1 block">Requires Resolution</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Take Revenue</span>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    ${(orders.reduce((sum, o) => sum + o.amount, 0) * (platformFee / 100)).toFixed(0)}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">{platformFee}% Platform Take Rate</span>
                </div>
              </div>

              {/* Escrow Ledger & System Gateways */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-4">Active Escrow Protection Orders</h3>
                  <div className="space-y-3">
                    {orders.map(ord => (
                      <div key={ord.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
                        <div>
                          <span className="text-xs font-bold text-white block mb-0.5">{ord.title}</span>
                          <span className="text-[11px] text-slate-400">Order #{ord.id} · Due {ord.dueDate}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-white block">${ord.amount}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            14-Day Escrow Protection
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white mb-4">System Alerts & Support Desk</h3>
                  <div className="space-y-3">
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block mb-0.5">{ticket.subject}</span>
                          <span className="text-[11px] text-slate-400">Ticket #{ticket.id} by {ticket.userName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded uppercase">
                          {ticket.priority} Priority
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: USER MANAGEMENT & IMPERSONATION */}
          {adminTab === 'users' && (
            <div className="space-y-6">
              {/* Top User Management Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span>User Account Management & Verification</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Search, filter, view complete activity history, edit profiles, toggle verification, and restrict user accounts.</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                    {usersList.length} Total Users Registered
                  </span>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search name, email, skills, title..." 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select 
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Account Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>

                  {/* Verification Filter */}
                  <div>
                    <select 
                      value={userVerifiedFilter}
                      onChange={(e) => setUserVerifiedFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Verification Statuses</option>
                      <option value="verified">Verified Only ✓</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>

                  {/* Role Filter */}
                  <div>
                    <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Marketplace User</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="support">Support Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="p-4">User Details</th>
                        <th className="p-4">Role & Title</th>
                        <th className="p-4">Wallet / Hourly</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {usersList
                        .filter(u => {
                          const q = userSearchQuery.toLowerCase();
                          const matchesSearch = !q || 
                            u.name.toLowerCase().includes(q) || 
                            u.email.toLowerCase().includes(q) || 
                            (u.title && u.title.toLowerCase().includes(q)) ||
                            (u.skills && u.skills.some(s => s.toLowerCase().includes(q)));
                          const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
                          const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                          const matchesVerified = userVerifiedFilter === 'all' || 
                            (userVerifiedFilter === 'verified' && u.verified) || 
                            (userVerifiedFilter === 'unverified' && !u.verified);
                          return matchesSearch && matchesStatus && matchesRole && matchesVerified;
                        })
                        .map(u => (
                          <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm">{u.name}</span>
                                    {u.verified && (
                                      <span className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full" title="Verified User">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase block w-max mb-1 ${
                                u.role === 'super_admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                u.role === 'moderator' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                u.role === 'support' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {u.role.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">{u.title || 'Marketplace Member'}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-white block">${u.walletBalance.toLocaleString()}</span>
                              <span className="text-[11px] text-slate-400">${u.hourlyRate || 0}/hr</span>
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleToggleUserVerify(u.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border transition-colors ${
                                  u.verified ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {u.verified ? '✓ Verified' : '+ Verify Badge'}
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                                u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                u.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              {/* Inspect Activity */}
                              <button 
                                onClick={() => setInspectingUser(u)}
                                className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="View complete user activity & history"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Activity</span>
                              </button>

                              {/* Edit Profile */}
                              <button 
                                onClick={() => handleOpenEditUserModal(u)}
                                className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="Edit user details"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Edit</span>
                              </button>

                              {/* Status Action Buttons */}
                              {u.status === 'active' ? (
                                <button 
                                  onClick={() => handleUserStatusToggle(u.id, 'suspended')}
                                  className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg hover:bg-red-500/20 text-[11px]"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUserStatusToggle(u.id, 'active')}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                >
                                  Activate
                                </button>
                              )}

                              {u.status !== 'restricted' && (
                                <button 
                                  onClick={() => handleUserStatusToggle(u.id, 'restricted')}
                                  className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold rounded-lg hover:bg-amber-500/20 text-[11px]"
                                >
                                  Restrict
                                </button>
                              )}

                              {/* Impersonate */}
                              <button 
                                onClick={() => handleStartImpersonation(u)}
                                className="px-2.5 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold rounded-lg hover:bg-indigo-500/30 transition-colors text-[11px]"
                              >
                                Impersonate
                              </button>

                              {/* Delete User */}
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2 py-1.5 bg-red-950/40 text-red-400 border border-red-900/50 font-bold rounded-lg hover:bg-red-900/50 text-[11px]"
                                title="Delete user permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSPECT USER ACTIVITY HISTORY MODAL */}
              {inspectingUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full space-y-6 max-h-[90vh] overflow-y-auto text-slate-200">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <img src={inspectingUser.avatar} className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/30" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-white">{inspectingUser.name}</h3>
                            {inspectingUser.verified && (
                              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{inspectingUser.email} · Role: <span className="text-emerald-400 uppercase font-bold">{inspectingUser.role}</span></p>
                          <p className="text-xs text-slate-300 font-medium mt-1">{inspectingUser.title}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setInspectingUser(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                      >
                        Close
                      </button>
                    </div>

                    {/* Stats summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Wallet Balance</span>
                        <span className="text-lg font-extrabold text-white">${inspectingUser.walletBalance.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Earned</span>
                        <span className="text-lg font-extrabold text-emerald-400">${(inspectingUser.earned || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Hourly Rate</span>
                        <span className="text-lg font-extrabold text-white">${inspectingUser.hourlyRate || 0}/hr</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Completed Jobs</span>
                        <span className="text-lg font-extrabold text-indigo-400">{inspectingUser.completedJobs || 0}</span>
                      </div>
                    </div>

                    {/* Tabs for complete user activity */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                      {(['overview', 'gigs', 'projects', 'proposals', 'orders', 'reviews', 'tickets'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setUserActivityTab(tab)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                            userActivityTab === tab ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {tab === 'overview' && 'Overview'}
                          {tab === 'gigs' && `Gigs (${gigs.filter(g => g.freelancerId === inspectingUser.id || g.freelancerName === inspectingUser.name).length})`}
                          {tab === 'projects' && `Projects (${projects.filter(p => p.buyerId === inspectingUser.id || p.buyerName === inspectingUser.name).length})`}
                          {tab === 'proposals' && `Proposals (${proposals.filter(p => p.freelancerId === inspectingUser.id).length})`}
                          {tab === 'orders' && `Orders & Escrow (${orders.filter(o => o.buyerId === inspectingUser.id || o.sellerId === inspectingUser.id).length})`}
                          {tab === 'reviews' && `Reviews (${reviews.filter(r => r.targetUserId === inspectingUser.id).length})`}
                          {tab === 'tickets' && `Support (${supportTickets.filter(t => t.userId === inspectingUser.id).length})`}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: Overview */}
                    {userActivityTab === 'overview' && (
                      <div className="space-y-4 text-xs">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <span className="text-slate-400 font-bold uppercase block mb-1">Biography</span>
                          <p className="text-slate-200">{inspectingUser.bio || 'No biography provided.'}</p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <span className="text-slate-400 font-bold uppercase block mb-2">Skills & Expertise</span>
                          <div className="flex flex-wrap gap-2">
                            {inspectingUser.skills && inspectingUser.skills.length > 0 ? (
                              inspectingUser.skills.map((sk, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-semibold">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">No skills listed</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Account Joined Date</span>
                          <span className="font-mono text-white">{inspectingUser.createdAt || '2025-01-15'}</span>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Gigs */}
                    {userActivityTab === 'gigs' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {gigs.filter(g => g.freelancerId === inspectingUser.id || g.freelancerName === inspectingUser.name).map(g => (
                          <div key={g.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block mb-0.5">{g.title}</span>
                              <span className="text-slate-400">{g.category} · Status: <strong className="text-emerald-400">{g.status}</strong></span>
                            </div>
                            <span className="font-extrabold text-white text-sm">₹{(g.price * 83).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 3: Projects */}
                    {userActivityTab === 'projects' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {projects.filter(p => p.buyerId === inspectingUser.id || p.buyerName === inspectingUser.name).map(p => (
                          <div key={p.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block mb-0.5">{p.title}</span>
                              <span className="text-slate-400">Budget: ${p.budgetMin} - ${p.budgetMax} · Status: <strong className="text-emerald-400">{p.status}</strong></span>
                            </div>
                            <span className="text-slate-400 font-mono">{p.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 4: Proposals */}
                    {userActivityTab === 'proposals' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {proposals.filter(p => p.freelancerId === inspectingUser.id).map(p => (
                          <div key={p.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">Bid Amount: ${p.bidAmount} ({p.deliveryDays} Days)</span>
                              <span className="text-emerald-400 font-bold uppercase">{p.status}</span>
                            </div>
                            <p className="text-slate-300 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">{p.coverLetter}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 5: Orders & Escrow */}
                    {userActivityTab === 'orders' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {orders.filter(o => o.buyerId === inspectingUser.id || o.sellerId === inspectingUser.id).map(o => (
                          <div key={o.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block mb-0.5">{o.title}</span>
                              <span className="text-slate-400">Order #{o.id} · Status: <strong className="text-emerald-400">{o.status}</strong></span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-white text-sm block">${o.amount}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">14-Day Escrow Vault</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 6: Reviews */}
                    {userActivityTab === 'reviews' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {reviews.filter(r => r.targetUserId === inspectingUser.id).map(r => (
                          <div key={r.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{r.reviewerName} (Rating: {r.rating} ★)</span>
                              <span className="text-slate-500">{r.createdAt}</span>
                            </div>
                            <p className="text-slate-300">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 7: Support Tickets */}
                    {userActivityTab === 'tickets' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {supportTickets.filter(t => t.userId === inspectingUser.id).map(t => (
                          <div key={t.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block mb-0.5">{t.subject}</span>
                              <span className="text-slate-400">Priority: {t.priority} · Status: {t.status}</span>
                            </div>
                            <span className="text-slate-500">{t.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EDIT USER MODAL */}
              {editingUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Edit User Profile — {editingUser.name}</h3>
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Full Name</label>
                          <input 
                            type="text" 
                            value={editUserForm.name}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Email Address</label>
                          <input 
                            type="email" 
                            value={editUserForm.email}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">System Role</label>
                          <select 
                            value={editUserForm.role}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="user">Marketplace User</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="support">Support Staff</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Account Status</label>
                          <select 
                            value={editUserForm.status}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="restricted">Restricted</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Professional Title</label>
                        <input 
                          type="text" 
                          value={editUserForm.title}
                          onChange={(e) => setEditUserForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Bio / Profile Summary</label>
                        <textarea 
                          rows={3}
                          value={editUserForm.bio}
                          onChange={(e) => setEditUserForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Skills (comma separated)</label>
                        <input 
                          type="text" 
                          value={editUserForm.skills}
                          onChange={(e) => setEditUserForm(prev => ({ ...prev, skills: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Hourly Rate ($/hr)</label>
                          <input 
                            type="number" 
                            value={editUserForm.hourlyRate}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Wallet Balance ($)</label>
                          <input 
                            type="number" 
                            value={editUserForm.walletBalance}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, walletBalance: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={editUserForm.verified}
                            onChange={(e) => setEditUserForm(prev => ({ ...prev, verified: e.target.checked }))}
                            className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>Verified User Badge Active</span>
                        </label>
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400"
                        >
                          Save User Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 3: PROJECTS MANAGEMENT */}
          {adminTab === 'projects' && (
            <div className="space-y-6">
              {/* Filter & Control Header */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                      <span>Projects & Buyer Requests Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage, search, filter, edit, publish, unpublish, suspend, restore, feature, and moderate buyer RFPs.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      {projects.length} Total Projects
                    </span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search title, buyer, description..." 
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select 
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open / Active</option>
                      <option value="published">Published</option>
                      <option value="unpublished">Unpublished (Draft)</option>
                      <option value="suspended">Suspended</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select 
                      value={projectCategoryFilter}
                      onChange={(e) => setProjectCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Featured Filter */}
                  <div>
                    <select 
                      value={projectFeaturedFilter}
                      onChange={(e) => setProjectFeaturedFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Listing Types</option>
                      <option value="featured">Featured Projects Only ★</option>
                      <option value="regular">Regular Projects Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Projects Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="p-4">Project & Buyer</th>
                        <th className="p-4">Category & Subcategory</th>
                        <th className="p-4">Budget & Deadline</th>
                        <th className="p-4">Proposals</th>
                        <th className="p-4">Featured</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {projects
                        .filter(p => {
                          const q = projectSearchQuery.toLowerCase();
                          const matchesSearch = !q || 
                            p.title.toLowerCase().includes(q) || 
                            p.description.toLowerCase().includes(q) ||
                            p.buyerName.toLowerCase().includes(q) ||
                            p.category.toLowerCase().includes(q);
                          const matchesStatus = projectStatusFilter === 'all' || p.status === projectStatusFilter;
                          const matchesCat = projectCategoryFilter === 'all' || p.category === projectCategoryFilter;
                          const matchesFeatured = projectFeaturedFilter === 'all' || 
                            (projectFeaturedFilter === 'featured' && p.featured) ||
                            (projectFeaturedFilter === 'regular' && !p.featured);
                          return matchesSearch && matchesStatus && matchesCat && matchesFeatured;
                        })
                        .map(p => (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img src={p.buyerAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer" onClick={() => setViewingProject(p)}>{p.title}</span>
                                    {p.featured && (
                                      <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">★ Featured</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400">Buyer: {p.buyerName} · Posted {p.createdAt}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-slate-200 block">{p.category}</span>
                              <span className="text-[11px] text-slate-400">{p.subcategory || 'General'}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-emerald-400 block">${p.budgetMin.toLocaleString()} - ${p.budgetMax.toLocaleString()}</span>
                              <span className="text-[11px] text-slate-400">{p.deadlineDays} Days Delivery</span>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 font-bold font-mono">
                                {p.proposalsCount} bids
                              </span>
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleToggleProjectFeature(p.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border transition-colors ${
                                  p.featured 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {p.featured ? '★ Featured' : '+ Feature'}
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                                p.status === 'open' || p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                p.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                p.status === 'unpublished' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              {/* View Details */}
                              <button 
                                onClick={() => setViewingProject(p)}
                                className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="View full project details"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>View</span>
                              </button>

                              {/* Edit */}
                              <button 
                                onClick={() => handleOpenEditProjectModal(p)}
                                className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="Edit project title, category, budget"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Edit</span>
                              </button>

                              {/* Publish / Unpublish Toggle */}
                              {p.status === 'unpublished' ? (
                                <button 
                                  onClick={() => handleUpdateProjectStatus(p.id, 'open')}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                >
                                  Publish
                                </button>
                              ) : p.status === 'open' || p.status === 'published' ? (
                                <button 
                                  onClick={() => handleUpdateProjectStatus(p.id, 'unpublished')}
                                  className="px-2.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 text-[11px]"
                                >
                                  Unpublish
                                </button>
                              ) : null}

                              {/* Suspend / Restore Toggle */}
                              {p.status === 'suspended' ? (
                                <button 
                                  onClick={() => handleUpdateProjectStatus(p.id, 'open')}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateProjectStatus(p.id, 'suspended')}
                                  className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg hover:bg-red-500/20 text-[11px]"
                                >
                                  Suspend
                                </button>
                              )}

                              {/* Moderate */}
                              <button 
                                onClick={() => handleOpenModerationModal(p)}
                                className="px-2.5 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold rounded-lg hover:bg-purple-500/30 text-[11px]"
                              >
                                Moderate
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => handleDeleteProject(p.id)}
                                className="px-2 py-1.5 bg-red-950/40 text-red-400 border border-red-900/50 font-bold rounded-lg hover:bg-red-900/50 text-[11px]"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VIEW PROJECT DETAILS MODAL */}
              {viewingProject && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-6 max-h-[90vh] overflow-y-auto text-slate-200">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-white">{viewingProject.title}</h3>
                          {viewingProject.featured && (
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-xs font-bold">★ Featured</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Project ID: #{viewingProject.id} · Category: <span className="text-emerald-400 font-semibold">{viewingProject.category} ({viewingProject.subcategory || 'General'})</span></p>
                      </div>
                      <button 
                        onClick={() => setViewingProject(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Budget Range</span>
                        <span className="text-base font-extrabold text-emerald-400">${viewingProject.budgetMin} - ${viewingProject.budgetMax}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Deadline</span>
                        <span className="text-base font-extrabold text-white">{viewingProject.deadlineDays} Days</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                        <span className="text-base font-extrabold text-indigo-400 uppercase">{viewingProject.status}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bids Received</span>
                        <span className="text-base font-extrabold text-purple-400">{viewingProject.proposalsCount}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Project Brief & Description</h4>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{viewingProject.description}</p>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={viewingProject.buyerAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
                        <div>
                          <span className="text-xs font-bold text-white block">{viewingProject.buyerName}</span>
                          <span className="text-[11px] text-slate-400">Buyer ID: {viewingProject.buyerId}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">Created: {viewingProject.createdAt}</span>
                    </div>

                    {viewingProject.moderationNotes && (
                      <div className="bg-purple-950/30 border border-purple-800/50 p-4 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-purple-300 block">Moderation Log Notes:</span>
                        <p className="text-slate-300">{viewingProject.moderationNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EDIT PROJECT MODAL */}
              {editingProject && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Edit Project — {editingProject.title}</h3>
                      <button 
                        onClick={() => setEditingProject(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditProject} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Project Title</label>
                        <input 
                          type="text" 
                          value={editProjectForm.title}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Category</label>
                          <select 
                            value={editProjectForm.category}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Subcategory</label>
                          <input 
                            type="text" 
                            value={editProjectForm.subcategory}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, subcategory: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Budget Min ($)</label>
                          <input 
                            type="number" 
                            value={editProjectForm.budgetMin}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Budget Max ($)</label>
                          <input 
                            type="number" 
                            value={editProjectForm.budgetMax}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Deadline (Days)</label>
                          <input 
                            type="number" 
                            value={editProjectForm.deadlineDays}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, deadlineDays: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Project Status</label>
                        <select 
                          value={editProjectForm.status}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="open">Open</option>
                          <option value="published">Published</option>
                          <option value="unpublished">Unpublished</option>
                          <option value="suspended">Suspended</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Project Description</label>
                        <textarea 
                          rows={4}
                          value={editProjectForm.description}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={editProjectForm.featured}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, featured: e.target.checked }))}
                            className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>Feature Project on Homepage & Listings</span>
                        </label>
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400"
                        >
                          Save Project
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODERATE PROJECT MODAL */}
              {moderatingProject && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Moderate Project — #{moderatingProject.id}</h3>
                      <button 
                        onClick={() => setModeratingProject(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveModeration} className="space-y-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold mb-1">Project Title:</span>
                        <span className="text-white font-extrabold text-sm block">{moderatingProject.title}</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Moderation Verdict</label>
                        <select 
                          value={moderationStatus}
                          onChange={(e) => setModerationStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="approved">✓ Approved (Complies with Policy)</option>
                          <option value="flagged">⚠ Flagged for Safety Review</option>
                          <option value="rejected">✕ Rejected (Policy Violation)</option>
                          <option value="pending">⏳ Pending Review</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Moderation Review Notes</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide details regarding policy compliance, safety checks, or rationale..."
                          value={moderationNotes}
                          onChange={(e) => setModerationNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => setModeratingProject(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400"
                        >
                          Save Moderation Verdict
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 4: SERVICES / GIGS */}
          {adminTab === 'gigs' && (
            <div className="space-y-6">
              {/* Filter & Control Header */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      <span>Freelancer Services & Gigs Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage, moderate, search, filter, edit, publish, unpublish, suspend, restore, feature, and audit freelancer services.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      {gigs.length} Total Services Listed
                    </span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search title, freelancer, desc..." 
                      value={gigSearchQuery}
                      onChange={(e) => setGigSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select 
                      value={gigStatusFilter}
                      onChange={(e) => setGigStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select 
                      value={gigCategoryFilter}
                      onChange={(e) => setGigCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Featured Filter */}
                  <div>
                    <select 
                      value={gigFeaturedFilter}
                      onChange={(e) => setGigFeaturedFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Listing Types</option>
                      <option value="featured">Featured Gigs ★</option>
                      <option value="regular">Regular Gigs Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Gigs Grid/List */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="p-4">Service & Freelancer</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Starting Price & Delivery</th>
                        <th className="p-4">Rating / Reviews</th>
                        <th className="p-4">Featured</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {gigs
                        .filter(g => {
                          const q = gigSearchQuery.toLowerCase();
                          const matchesSearch = !q || 
                            g.title.toLowerCase().includes(q) || 
                            g.description.toLowerCase().includes(q) ||
                            g.freelancerName.toLowerCase().includes(q) ||
                            g.category.toLowerCase().includes(q);
                          const matchesStatus = gigStatusFilter === 'all' || g.status === gigStatusFilter;
                          const matchesCat = gigCategoryFilter === 'all' || g.category === gigCategoryFilter;
                          const matchesFeatured = gigFeaturedFilter === 'all' || 
                            (gigFeaturedFilter === 'featured' && g.featured) ||
                            (gigFeaturedFilter === 'regular' && !g.featured);
                          return matchesSearch && matchesStatus && matchesCat && matchesFeatured;
                        })
                        .map(g => (
                          <tr key={g.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img src={g.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop'} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer" onClick={() => setViewingGig(g)}>{g.title}</span>
                                    {g.featured && (
                                      <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">★ Featured</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                    <img src={g.freelancerAvatar} className="w-4 h-4 rounded-full object-cover" />
                                    <span>{g.freelancerName} ({g.freelancerLevel || 'Freelancer'})</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-slate-200 block">{g.category}</span>
                              <span className="text-[11px] text-slate-400">{g.subcategory || 'General'}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-emerald-400 block">${g.price.toLocaleString()}</span>
                              <span className="text-[11px] text-slate-400">{g.deliveryDays} Days Delivery</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-amber-400 font-mono">★ {g.rating || 5.0}</span>
                                <span className="text-slate-500">({g.reviewsCount || 0})</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleToggleGigFeature(g.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border transition-colors ${
                                  g.featured 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {g.featured ? '★ Featured' : '+ Feature'}
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                                g.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                g.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {g.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* View Details */}
                              <button 
                                onClick={() => setViewingGig(g)}
                                className="px-2 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="Inspect Service"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>View</span>
                              </button>

                              {/* Edit */}
                              <button 
                                onClick={() => handleOpenEditGigModal(g)}
                                className="px-2 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="Edit Service details"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Edit</span>
                              </button>

                              {/* Publish / Unpublish Toggle */}
                              {g.status === 'draft' ? (
                                <button 
                                  onClick={() => handleUpdateGigStatus(g.id, 'published')}
                                  className="px-2 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                >
                                  Publish
                                </button>
                              ) : g.status === 'published' ? (
                                <button 
                                  onClick={() => handleUpdateGigStatus(g.id, 'draft')}
                                  className="px-2 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 text-[11px]"
                                >
                                  Unpublish
                                </button>
                              ) : null}

                              {/* Suspend / Restore Toggle */}
                              {g.status === 'suspended' ? (
                                <button 
                                  onClick={() => handleUpdateGigStatus(g.id, 'published')}
                                  className="px-2 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateGigStatus(g.id, 'suspended')}
                                  className="px-2 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg hover:bg-red-500/20 text-[11px]"
                                >
                                  Suspend
                                </button>
                              )}

                              {/* Moderate */}
                              <button 
                                onClick={() => handleOpenGigModerationModal(g)}
                                className="px-2 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold rounded-lg hover:bg-purple-500/30 text-[11px]"
                              >
                                Moderate
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => handleDeleteGig(g.id)}
                                className="px-2 py-1.5 bg-red-950/40 text-red-400 border border-red-900/50 font-bold rounded-lg hover:bg-red-900/50 text-[11px] inline-flex items-center gap-1"
                                title="Delete Gig permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSPECT GIG DETAILS MODAL */}
              {viewingGig && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-6 max-h-[90vh] overflow-y-auto text-slate-200">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-white">{viewingGig.title}</h3>
                          {viewingGig.featured && (
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-xs font-bold">★ Featured</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Gig ID: #{viewingGig.id} · Category: <span className="text-emerald-400 font-semibold">{viewingGig.category} ({viewingGig.subcategory || 'General'})</span></p>
                      </div>
                      <button 
                        onClick={() => setViewingGig(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <img 
                          src={viewingGig.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop'} 
                          className="w-full h-48 rounded-2xl object-cover border border-slate-800 shadow-inner" 
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Starting Price</span>
                            <span className="text-sm font-extrabold text-emerald-400">${viewingGig.price}</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Delivery Time</span>
                            <span className="text-sm font-extrabold text-white">{viewingGig.deliveryDays} Days</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Rating</span>
                            <span className="text-sm font-extrabold text-amber-400">★ {viewingGig.rating || 5.0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Gig Description</span>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{viewingGig.description}</p>
                        </div>

                        {viewingGig.extras && viewingGig.extras.length > 0 && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Gig Upgrades & Extras</span>
                            <div className="space-y-2">
                              {viewingGig.extras.map(e => (
                                <div key={e.id} className="flex justify-between items-center text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-200">{e.title}</span>
                                  <span className="font-bold text-emerald-400">+${e.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={viewingGig.freelancerAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
                        <div>
                          <span className="text-xs font-bold text-white block">{viewingGig.freelancerName}</span>
                          <span className="text-[11px] text-slate-400">Freelancer ID: {viewingGig.freelancerId} · Level: {viewingGig.freelancerLevel || 'Pro'}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">Moderation: {viewingGig.moderationStatus || 'Pending review'}</span>
                    </div>

                    {viewingGig.moderationNotes && (
                      <div className="bg-purple-950/30 border border-purple-800/50 p-4 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-purple-300 block">Moderation Log Notes:</span>
                        <p className="text-slate-300">{viewingGig.moderationNotes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <button 
                        onClick={() => {
                          if (viewingGig) {
                            handleDeleteGig(viewingGig.id);
                            setViewingGig(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Service</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const g = viewingGig;
                            setViewingGig(null);
                            handleOpenEditGigModal(g);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 font-bold rounded-xl flex items-center gap-1 text-xs transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Edit Details</span>
                        </button>
                        <button 
                          onClick={() => setViewingGig(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT GIG DETAILS MODAL */}
              {editingGig && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Edit Service — {editingGig.title}</h3>
                      <button 
                        onClick={() => setEditingGig(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditGig} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Service / Gig Title</label>
                        <input 
                          type="text" 
                          value={editGigForm.title}
                          onChange={(e) => setEditGigForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Category</label>
                          <select 
                            value={editGigForm.category}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Subcategory</label>
                          <input 
                            type="text" 
                            value={editGigForm.subcategory}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, subcategory: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Base Price ($)</label>
                          <input 
                            type="number" 
                            value={editGigForm.price}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Delivery Time (Days)</label>
                          <input 
                            type="number" 
                            value={editGigForm.deliveryDays}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, deliveryDays: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Status</label>
                          <select 
                            value={editGigForm.status}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Description</label>
                        <textarea 
                          rows={4}
                          value={editGigForm.description}
                          onChange={(e) => setEditGigForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={editGigForm.featured}
                            onChange={(e) => setEditGigForm(prev => ({ ...prev, featured: e.target.checked }))}
                            className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>Feature Gig on Homepage & Listings</span>
                        </label>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                        <button 
                          type="button"
                          onClick={() => {
                            if (editingGig) {
                              handleDeleteGig(editingGig.id);
                              setEditingGig(null);
                            }
                          }}
                          className="px-4 py-2 bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Service</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setEditingGig(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 text-xs"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 text-xs"
                          >
                            Save Gig Details
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODERATE GIG MODAL */}
              {moderatingGig && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Moderate Service / Gig</h3>
                      <button 
                        onClick={() => setModeratingGig(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveGigModeration} className="space-y-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold mb-1">Gig Title:</span>
                        <span className="text-white font-extrabold text-sm block">{moderatingGig.title}</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Moderation Verdict</label>
                        <select 
                          value={gigModerationStatus}
                          onChange={(e) => setGigModerationStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="approved">✓ Approved (Complies with Policy)</option>
                          <option value="flagged">⚠ Flagged for Policy Warning</option>
                          <option value="rejected">✕ Rejected (Policy Violation)</option>
                          <option value="pending">⏳ Pending Review</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Moderation Review Notes</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide rationales, warning notes, or feedback for the seller..."
                          value={gigModerationNotes}
                          onChange={(e) => setGigModerationNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => setModeratingGig(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400"
                        >
                          Save Moderation Verdict
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 5: CATEGORIES & SUBCATEGORIES MANAGEMENT */}
          {adminTab === 'categories' && (
            <div className="space-y-6">
              {/* Add New Category Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white mb-2">Add New Parent Category</h3>
                <p className="text-xs text-slate-400 mb-4">Create top-level marketplace categories with clean search-engine friendly slugs.</p>
                <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Category Name (e.g. Writing & Translation)..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 w-full"
                  />
                  <input 
                    type="text" 
                    placeholder="Slug (optional e.g. writing-translation)..." 
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 w-full"
                  />
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Category</span>
                  </button>
                </form>
              </div>

              {/* Categories & Subcategories Directory */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Categories & Subcategories Directory</h3>
                    <p className="text-xs text-slate-400">Edit titles, manage slugs, toggle status (ON/OFF), or bulk delete categories.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {(selectedCatIds.length > 0 || selectedSubPairs.length > 0) && (
                      <button 
                        onClick={handleBulkDeleteCategories}
                        className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500 transition-colors shadow-md flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bulk Delete Selected ({selectedCatIds.length + selectedSubPairs.length})</span>
                      </button>
                    )}
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      {categories.length} Categories Total
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {categories.map(cat => {
                    const isEditingThisCat = editingCatId === cat.id;
                    const isCatSelected = selectedCatIds.includes(cat.id);

                    return (
                      <div key={cat.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                        {/* Parent Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-3 flex-1">
                            <input 
                              type="checkbox"
                              checked={isCatSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCatIds(prev => [...prev, cat.id]);
                                } else {
                                  setSelectedCatIds(prev => prev.filter(id => id !== cat.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                            />

                            {isEditingThisCat ? (
                              <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                                <input 
                                  type="text" 
                                  value={editCatName} 
                                  onChange={(e) => setEditCatName(e.target.value)} 
                                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                                />
                                <input 
                                  type="text" 
                                  value={editCatSlug} 
                                  onChange={(e) => setEditCatSlug(e.target.value)} 
                                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-emerald-400 font-mono"
                                />
                                <button 
                                  onClick={() => handleUpdateCategory(cat.id)}
                                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingCatId(null)}
                                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white">{cat.name}</span>
                                <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  /categories/{cat.slug}
                                </span>
                              </div>
                            )}
                          </div>

                          {!isEditingThisCat && (
                            <div className="flex items-center gap-2">
                              {/* On/Off Toggle Button */}
                              <button 
                                onClick={() => handleToggleCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-colors ${cat.enabled !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                              >
                                {cat.enabled !== false ? '● ON' : '○ OFF'}
                              </button>

                              <button 
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditCatName(cat.name);
                                  setEditCatSlug(cat.slug);
                                }}
                                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white font-bold rounded-lg text-xs hover:bg-slate-700 transition-colors"
                              >
                                Edit Category
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg text-xs hover:bg-red-500/20 transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Subcategories List */}
                        <div className="pl-4 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subcategories</span>
                            <button 
                              onClick={() => {
                                setAddingSubForCatId(addingSubForCatId === cat.id ? null : cat.id);
                                setNewSubcategoryName('');
                              }}
                              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Add Subcategory</span>
                            </button>
                          </div>

                          {/* Add subcategory inline input */}
                          {addingSubForCatId === cat.id && (
                            <div className="flex items-center gap-2 mb-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <input 
                                type="text" 
                                placeholder="Subcategory name (e.g. Logo Design)..." 
                                value={newSubcategoryName}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                              />
                              <button 
                                onClick={() => handleAddSubcategory(cat.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400"
                              >
                                Add
                              </button>
                              <button 
                                onClick={() => setAddingSubForCatId(null)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-lg hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {cat.subcategories.map(sub => {
                            const isEditingSub = editingSubId?.catId === cat.id && editingSubId?.subId === sub.id;
                            const isSubSelected = selectedSubPairs.some(p => p.catId === cat.id && p.subId === sub.id);

                            return (
                              <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs">
                                {isEditingSub ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input 
                                      type="text" 
                                      value={editSubName}
                                      onChange={(e) => setEditSubName(e.target.value)}
                                      className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                    />
                                    <button 
                                      onClick={() => handleUpdateSubcategory(cat.id, sub.id)}
                                      className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-xs"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingSubId(null)}
                                      className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2.5">
                                      <input 
                                        type="checkbox"
                                        checked={isSubSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedSubPairs(prev => [...prev, { catId: cat.id, subId: sub.id }]);
                                          } else {
                                            setSelectedSubPairs(prev => prev.filter(p => !(p.catId === cat.id && p.subId === sub.id)));
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                      />
                                      <span className="text-slate-400">•</span>
                                      <span className="font-semibold text-slate-200">{sub.name}</span>
                                      <span className="text-[11px] font-mono text-slate-500">(`/categories/${sub.slug}`)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Subcategory On/Off Toggle */}
                                      <button 
                                        onClick={() => handleToggleSubcategory(cat.id, sub.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-colors ${sub.enabled !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                                      >
                                        {sub.enabled !== false ? 'ON' : 'OFF'}
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingSubId({ catId: cat.id, subId: sub.id });
                                          setEditSubName(sub.name);
                                        }}
                                        className="text-slate-400 hover:text-white font-semibold text-[11px]"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteSubcategory(cat.id, sub.id, sub.name)}
                                        className="text-red-400 hover:text-red-300 font-semibold text-[11px]"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 5: ALL ORDERS MANAGEMENT */}
          {adminTab === 'orders' && (
            <AdminOrdersManager
              orders={orders as any}
              users={usersList as any}
              gigs={gigs}
              currentUser={currentUser}
              onRefreshOrders={fetchAllAdminData}
              getGigUrl={getGigUrl}
            />
          )}

          {/* MODULE 6: PROPOSALS & BIDS MANAGEMENT */}
          {adminTab === 'proposals' && (
            <div className="space-y-6">
              {/* Filter & Control Header */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span>Proposals & Bidding Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage, search, filter, edit, approve, reject, or delete freelancer bids and project relationships.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      {proposals.length} Total Bids / Proposals
                    </span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search freelancer, project, cover letter..." 
                      value={proposalSearchQuery}
                      onChange={(e) => setProposalSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select 
                      value={proposalStatusFilter}
                      onChange={(e) => setProposalStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <select 
                      value={proposalSort}
                      onChange={(e) => setProposalSort(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="bid_high">Sort: Bid Amount High-Low</option>
                      <option value="bid_low">Sort: Bid Amount Low-High</option>
                    </select>
                  </div>

                  {/* Bid Range Filter */}
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Min $" 
                      value={proposalBidMinFilter}
                      onChange={(e) => setProposalBidMinFilter(e.target.value)}
                      className="w-1/2 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <input 
                      type="number" 
                      placeholder="Max $" 
                      value={proposalBidMaxFilter}
                      onChange={(e) => setProposalBidMaxFilter(e.target.value)}
                      className="w-1/2 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Proposals Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="p-4">Freelancer</th>
                        <th className="p-4">Project / RFP Target</th>
                        <th className="p-4">Bid Amount & Delivery</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Created At</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {proposals
                        .filter(p => {
                          const q = proposalSearchQuery.toLowerCase();
                          const proj = projects.find(projItem => projItem.id === p.projectId);
                          const projectTitle = proj ? proj.title : '';
                          const matchesSearch = !q || 
                            p.freelancerName.toLowerCase().includes(q) || 
                            p.coverLetter.toLowerCase().includes(q) ||
                            projectTitle.toLowerCase().includes(q);
                          const matchesStatus = proposalStatusFilter === 'all' || p.status === proposalStatusFilter;
                          
                          const minVal = Number(proposalBidMinFilter) || 0;
                          const maxVal = Number(proposalBidMaxFilter) || Infinity;
                          const matchesBid = p.bidAmount >= minVal && p.bidAmount <= maxVal;

                          return matchesSearch && matchesStatus && matchesBid;
                        })
                        .sort((a, b) => {
                          if (proposalSort === 'bid_high') return b.bidAmount - a.bidAmount;
                          if (proposalSort === 'bid_low') return a.bidAmount - b.bidAmount;
                          return b.id.localeCompare(a.id); // default/newest
                        })
                        .map(p => {
                          const proj = projects.find(projItem => projItem.id === p.projectId);
                          return (
                            <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img src={p.freelancerAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800 shrink-0" />
                                  <div>
                                    <span className="font-bold text-white text-sm block">{p.freelancerName}</span>
                                    <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">{p.freelancerTitle}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                {proj ? (
                                  <div>
                                    <span className="font-semibold text-slate-200 block text-xs truncate max-w-[220px]">{proj.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Project ID: #{proj.id} · Buyer: {proj.buyerName}</span>
                                  </div>
                                ) : (
                                  <span className="text-red-400 font-semibold">Unknown / Deleted Project</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="font-extrabold text-emerald-400 block text-sm">${p.bidAmount.toLocaleString()}</span>
                                <span className="text-[11px] text-slate-400">{p.deliveryDays} Days Delivery</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                                  p.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  p.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-400">
                                {p.createdAt || '2026-10-02'}
                              </td>
                              <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                {/* View Proposal Details */}
                                <button 
                                  onClick={() => setViewingProposal(p)}
                                  className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                  title="View complete cover letter & details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>View</span>
                                </button>

                                {/* Edit Proposal */}
                                <button 
                                  onClick={() => handleOpenEditProposalModal(p)}
                                  className="px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                                  title="Edit bid parameters"
                                >
                                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Edit</span>
                                </button>

                                {/* Quick Accept */}
                                {p.status !== 'accepted' && (
                                  <button 
                                    onClick={() => handleUpdateProposalStatus(p.id, 'accepted')}
                                    className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 text-[11px]"
                                    title="Accept Proposal"
                                  >
                                    Accept
                                  </button>
                                )}

                                {/* Quick Reject */}
                                {p.status !== 'rejected' && (
                                  <button 
                                    onClick={() => handleUpdateProposalStatus(p.id, 'rejected')}
                                    className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg hover:bg-red-500/20 text-[11px]"
                                    title="Reject Proposal"
                                  >
                                    Reject
                                  </button>
                                )}

                                {/* Delete */}
                                <button 
                                  onClick={() => handleDeleteProposal(p.id)}
                                  className="px-2 py-1.5 bg-red-950/40 text-red-400 border border-red-900/50 font-bold rounded-lg hover:bg-red-900/50 text-[11px]"
                                  title="Delete Proposal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {proposals.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">No proposals or bids recorded in the platform database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VIEW PROPOSAL DETAILS MODAL */}
              {viewingProposal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto text-slate-200">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg font-bold text-white">Proposal #{viewingProposal.id} Details</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Submitted by <span className="text-emerald-400 font-semibold">{viewingProposal.freelancerName}</span></p>
                      </div>
                      <button 
                        onClick={() => setViewingProposal(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Bid Amount</span>
                        <span className="text-lg font-extrabold text-emerald-400">${viewingProposal.bidAmount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Delivery Time</span>
                        <span className="text-lg font-extrabold text-white">{viewingProposal.deliveryDays} Days</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Current Status</span>
                        <span className="text-lg font-extrabold text-indigo-400 uppercase">{viewingProposal.status}</span>
                      </div>
                    </div>

                    {/* Freelancer Profile Shortcard */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <img src={viewingProposal.freelancerAvatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-white block">{viewingProposal.freelancerName}</span>
                        <span className="text-xs text-slate-400">{viewingProposal.freelancerTitle}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">ID: {viewingProposal.freelancerId}</span>
                      </div>
                    </div>

                    {/* Target Project Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Project / Bid Relationship Target</span>
                      {projects.find(pr => pr.id === viewingProposal.projectId) ? (
                        <div>
                          <span className="text-xs font-bold text-white block mb-1">{projects.find(pr => pr.id === viewingProposal.projectId)?.title}</span>
                          <span className="text-[11px] text-slate-400">Budget Range: <span className="text-emerald-400 font-semibold">${projects.find(pr => pr.id === viewingProposal.projectId)?.budgetMin} - ${projects.find(pr => pr.id === viewingProposal.projectId)?.budgetMax}</span></span>
                        </div>
                      ) : (
                        <span className="text-red-400 text-xs font-semibold">Referenced project has been deleted or suspended.</span>
                      )}
                    </div>

                    {/* Description/Cover Letter */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase">Cover Letter & Description / Milestones</h4>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{viewingProposal.coverLetter}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT PROPOSAL MODAL */}
              {editingProposal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 text-slate-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Edit Bid Parameters — Proposal #{editingProposal.id}</h3>
                      <button 
                        onClick={() => setEditingProposal(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditProposal} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Bid Amount ($)</label>
                          <input 
                            type="number" 
                            value={editProposalForm.bidAmount}
                            onChange={(e) => setEditProposalForm(prev => ({ ...prev, bidAmount: Number(e.target.value) }))}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1">Delivery Time (Days)</label>
                          <input 
                            type="number" 
                            value={editProposalForm.deliveryDays}
                            onChange={(e) => setEditProposalForm(prev => ({ ...prev, deliveryDays: Number(e.target.value) }))}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Proposal Status</label>
                        <select 
                          value={editProposalForm.status}
                          onChange={(e) => setEditProposalForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Cover Letter & Milestones / Deliverables</label>
                        <textarea 
                          rows={6}
                          value={editProposalForm.coverLetter}
                          onChange={(e) => setEditProposalForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => setEditingProposal(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400"
                        >
                          Save Proposal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 10: USER WALLETS & DOUBLE-ENTRY LEDGER */}
          {adminTab === 'wallet' && (
            <UserWalletsLedgerModule currentUser={currentUser} />
          )}

          {/* MODULE 11: ESCROW MANAGEMENT (MANDATORY 14-DAY PROTECTION) */}
          {adminTab === 'escrow' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Escrow Protection Vault</h3>
                  <p className="text-xs text-slate-400">Enforcing mandatory 14-day protection window on all milestone funds.</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  {escrowProtectionDays}-Day Lock Policy
                </span>
              </div>

              {orders.map(ord => (
                <div key={ord.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {(() => {
                        const targetUrl = ord.serviceUrl || (ord.gigId && gigs.find(g => g.id === ord.gigId) ? getGigUrl(gigs.find(g => g.id === ord.gigId)!) : (ord.id === 'ord_bk' ? '/broadcastking/create-an-amazing-promotional-explainer-video-a-puppet' : ord.id === 'ord_bushra' ? '/bushra/i-will-increase-ahrefs-domain-rating-dr-70-using-high-authority-seo-backlinks' : '/elena_rostova/i-will-build-a-high-performance-full-stack-web-app-in-react-and-node'));
                        return (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1 group"
                              title={`View "${ord.title}" in new tab`}
                            >
                              <span className="group-hover:underline">{ord.title}</span>
                              <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
                            </a>
                          </div>
                        );
                      })()}
                      <span className="text-[11px] text-slate-400">Buyer ID: {ord.buyerId} · Seller ID: {ord.sellerId}</span>
                    </div>
                    <span className="text-base font-extrabold text-emerald-400">${ord.amount}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Protection Start</span>
                      <span className="font-mono">{ord.escrowProtectionStartDate || '2026-10-05'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Protection End (14 Days)</span>
                      <span className="font-mono text-emerald-400">{ord.escrowProtectionEndDate || '2026-10-19'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: 'completed' } : o));
                        alert(`Escrow released for order #${ord.id}`);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400"
                    >
                      Release Funds
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 7: PAYOUT MANAGEMENT */}
          {adminTab === 'payouts' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Payout Management</h3>
                <p className="text-xs text-slate-400">Manage freelancer payouts, statuses, and prevent duplicates.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase font-bold">
                      <th className="p-3">Freelancer ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {payouts.map(p => (
                      <tr key={p.id}>
                        <td className="p-3">{p.freelancerId}</td>
                        <td className="p-3">${p.amount}</td>
                        <td className="p-3 capitalize">{p.status}</td>
                        <td className="p-3 text-right space-x-2">
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprovePayout(p.id)} className="text-emerald-400 font-bold hover:text-emerald-300">Approve</button>
                              <button onClick={() => handleFailPayout(p.id)} className="text-red-400 font-bold hover:text-red-300">Fail</button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => handleProcessPayout(p.id)} className="text-blue-400 font-bold hover:text-blue-300">Process</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 11: DISPUTE MANAGEMENT */}
          {adminTab === 'disputes' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white mb-4">Escrow Dispute Investigation Desk</h3>
              {disputes.map(disp => (
                <div key={disp.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Dispute #{disp.id} on Order #{disp.orderId}: {orders.find(o => o.id === disp.orderId)?.title || 'Unknown Order'}</span>
                    <span className="text-xs font-bold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                      {disp.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <strong>Reason:</strong> {disp.reason}
                  </p>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleResolveDispute(disp.id, 'resolved_refund')}
                      className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs rounded-lg hover:bg-red-500/30"
                    >
                      Full Refund to Buyer
                    </button>
                    <button 
                      onClick={() => handleResolveDispute(disp.id, 'resolved_release')}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-lg hover:bg-emerald-500/30"
                    >
                      Release Escrow to Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 17: SUPPORT TICKETS */}
          {adminTab === 'support' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white mb-4">Support Ticket Help Desk</h3>
              {supportTickets.map(ticket => (
                <div key={ticket.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{ticket.subject}</span>
                      <span className="text-xs text-slate-400">User: {ticket.userName} · Priority: {ticket.priority}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded">
                      {ticket.status}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    {ticket.messages.map((m, idx) => (
                      <div key={idx} className="text-slate-300">
                        <strong className="text-white">{m.sender}:</strong> {m.text}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type staff reply..." 
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button 
                      onClick={() => handleSupportReply(ticket.id)}
                      className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400"
                    >
                      Reply Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 20: ACTIVITY & AUDIT TRAIL */}
          {(adminTab === 'security' || adminTab === 'activity') && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      <span>Admin Activity Logs & Audit Trail</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time audit log of all administrative actions, user status changes, impersonation sessions, and category modifications.</p>
                  </div>
                  <button 
                    onClick={fetchAllAdminData}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Refresh Activity Stream</span>
                  </button>
                </div>

                {/* Activity Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Actions Logged</span>
                    <div className="text-xl font-extrabold text-white mt-1">{auditLogs.length}</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User Governance</span>
                    <div className="text-xl font-extrabold text-amber-400 mt-1">
                      {auditLogs.filter(l => l.action.includes('USER')).length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Impersonation Audits</span>
                    <div className="text-xl font-extrabold text-indigo-400 mt-1">
                      {auditLogs.filter(l => l.action.includes('IMPERSONAT')).length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category Operations</span>
                    <div className="text-xl font-extrabold text-emerald-400 mt-1">
                      {auditLogs.filter(l => l.action.includes('CATEGORY')).length}
                    </div>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search activity action, actor, target, or details..." 
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <select 
                      value={activityActionFilter}
                      onChange={(e) => setActivityActionFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Administrative Actions</option>
                      <option value="user_status">User Status (Suspend / Restrict)</option>
                      <option value="impersonated">Admin Impersonations</option>
                      <option value="category">Category / Subcategory Edits</option>
                      <option value="dispute">Dispute Resolutions</option>
                      <option value="support">Support Ticket Replies</option>
                    </select>
                  </div>
                </div>

                {/* Activity Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold bg-slate-900/60">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin Actor</th>
                        <th className="py-3 px-4">Action Type</th>
                        <th className="py-3 px-4">Target Entity</th>
                        <th className="py-3 px-4">Activity Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {auditLogs
                        .filter(log => {
                          const query = activitySearchQuery.toLowerCase().trim();
                          const matchesQuery = !query || 
                            log.action.toLowerCase().includes(query) ||
                            log.actor.toLowerCase().includes(query) ||
                            log.target.toLowerCase().includes(query) ||
                            log.details.toLowerCase().includes(query);

                          let matchesFilter = true;
                          if (activityActionFilter === 'user_status') matchesFilter = log.action.includes('STATUS') || log.action.includes('SUSPEND') || log.action.includes('RESTRICT');
                          else if (activityActionFilter === 'impersonated') matchesFilter = log.action.includes('IMPERSONAT');
                          else if (activityActionFilter === 'category') matchesFilter = log.action.includes('CATEGORY');
                          else if (activityActionFilter === 'dispute') matchesFilter = log.action.includes('DISPUTE');
                          else if (activityActionFilter === 'support') matchesFilter = log.action.includes('SUPPORT') || log.action.includes('TICKET');

                          return matchesQuery && matchesFilter;
                        })
                        .map(log => {
                          let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
                          if (log.action.includes('SUSPEND') || log.action.includes('DELETED')) badgeBg = 'bg-red-500/20 text-red-300 border-red-500/30';
                          else if (log.action.includes('RESTRICT')) badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                          else if (log.action.includes('IMPERSONAT')) badgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                          else if (log.action.includes('CREATED') || log.action.includes('VERIFIED')) badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                          else if (log.action.includes('RESOLVED') || log.action.includes('UPDATED')) badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                          return (
                            <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                              <td className="py-3 px-4 font-bold text-white">
                                <div>{log.actor}</div>
                                <span className="text-[10px] text-slate-500 uppercase">{log.role}</span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${badgeBg}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">{log.target}</td>
                              <td className="py-3 px-4 text-slate-300">{log.details}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {auditLogs.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs">No admin activity records logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK FOR OTHER MODULES */}
          {!['overview', 'users', 'projects', 'gigs', 'categories', 'escrow', 'disputes', 'support', 'security', 'activity'].includes(adminTab) && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white uppercase">{adminTab} Module Active</h3>
              <p className="text-xs text-slate-400">All data records and audit logs for this module are synchronized with PostgreSQL storage.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* IMPERSONATION BANNER */}
      {impersonatedUser && (
        <div className="bg-indigo-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>SUPER ADMIN IMPERSONATION ACTIVE: You are viewing WorkPerHour as {impersonatedUser.name} ({impersonatedUser.role})</span>
          </div>
          <button 
            onClick={handleStopImpersonation}
            className="px-3 py-1 bg-white text-indigo-900 rounded-md font-extrabold hover:bg-slate-100 transition-colors shadow-xs"
          >
            End Impersonation & Return to Admin
          </button>
        </div>
      )}

      {/* Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <a href="/gigs" onClick={(e) => navigate('/gigs', e)} className="flex items-center gap-2.5 text-left group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-slate-800 transition-colors">
              W
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-none">WorkPerHour</span>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Secure Escrow Marketplace</span>
            </div>
          </a>
        </div>

        {/* Zone 2: Nav links with clean pathnames */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a 
            href="/gigs" 
            onClick={(e) => navigate('/gigs', e)}
            className={`transition-colors hover:text-slate-900 py-1 ${isGigsList || isGigDetail ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''}`}
          >
            Explore Gigs
          </a>
          <a 
            href="/projects" 
            onClick={(e) => navigate('/projects', e)}
            className={`transition-colors hover:text-slate-900 py-1 ${isProjectsList || isProjectDetail ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''}`}
          >
            Buyer Requests
          </a>
          <a 
            href="/orders" 
            onClick={(e) => navigate('/orders', e)}
            className={`transition-colors hover:text-slate-900 py-1 ${isOrders ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''}`}
          >
            My Orders & Escrow
          </a>
          <a 
            href="/messages" 
            onClick={(e) => navigate('/messages', e)}
            className={`transition-colors hover:text-slate-900 py-1 ${isMessages ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''}`}
          >
            Live Chat
          </a>
        </nav>

        {/* Zone 3: Primary Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Email Inbox Button */}
          <button 
            onClick={() => setIsEmailModalOpen(true)}
            className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
            title="Official Email Inbox & System Notices"
          >
            <MessageSquare className="w-4 h-4 text-slate-700" />
            {userEmails.filter(e => !e.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {userEmails.filter(e => !e.read).length}
              </span>
            )}
          </button>

          {/* Contact Support Button */}
          <button 
            onClick={() => setIsSupportModalOpen(true)}
            className="p-2 sm:px-3 sm:py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Contact WorkSphere Support Desk"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Contact Support</span>
          </button>

          <a 
            href="/post-project"
            onClick={(e) => navigate('/post-project', e)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Post Project</span>
          </a>
          <a 
            href="/create-gig"
            onClick={(e) => navigate('/create-gig', e)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Gig</span>
          </a>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img src={impersonatedUser ? impersonatedUser.avatar : currentUser.avatar} className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20" />
            <div className="hidden xl:block text-left">
              <span className="text-xs font-semibold text-slate-900 block">
                {impersonatedUser ? impersonatedUser.name : currentUser.name}
              </span>
              <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                {impersonatedUser ? 'Impersonated User' : currentUser.title}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ACCOUNT STATUS ALERT BANNER (SUSPENDED / RESTRICTED) */}
      {((impersonatedUser ? impersonatedUser.status : currentUser.status) === 'suspended' || (impersonatedUser ? impersonatedUser.status : currentUser.status) === 'restricted') && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between text-xs font-bold shadow-md sticky top-14 z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>
              ACCOUNT NOTICE: Your WorkSphere account is currently 
              <span className="uppercase underline mx-1">{(impersonatedUser || currentUser).status}</span>.
              An official notice was sent to your Chat & Email. Please contact support immediately.
            </span>
          </div>
          <button 
            onClick={() => setIsSupportModalOpen(true)}
            className="px-4 py-1.5 bg-white text-red-900 rounded-lg font-extrabold hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Contact Support Desk</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* VIEW 1: GIGS EXPLORE MARKETPLACE */}
        {isGigsList && (
          <div>
            {/* Hero Banner */}
            <div className="relative rounded-3xl bg-slate-900 text-white p-8 md:p-12 mb-10 overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop')` }}></div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" /> 100% Escrow Protection Guaranteed
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-wrap balance">
                  {currentCategory === 'All' ? 'Hire top freelance talent for fixed-price gigs' : `${currentCategory} Freelance Gigs`}
                </h1>
                <p className="text-slate-300 text-sm md:text-base mb-8">
                  Connect with elite developers, designers, and AI experts. Funds are safely held in escrow until you approve the deliverables.
                </p>

                {/* Search Bar */}
                <div className="flex items-center bg-white rounded-2xl p-2 shadow-lg max-w-xl">
                  <Search className="w-5 h-5 text-slate-400 ml-3" />
                  <input 
                    type="text" 
                    placeholder="Search services (e.g. React, UI/UX, Gemini AI)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button className="px-6 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Toolbar Bar */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Service Options Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'service' ? null : 'service')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>Service options {serviceOptionFilter !== 'All' ? `(${serviceOptionFilter})` : ''}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'service' ? 'rotate-270' : 'rotate-90'} text-slate-400`} />
                  </button>
                  {activeDropdown === 'service' && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                      {['All', 'Development & IT', 'AI & Data', 'Design & Creative', 'Mobile Apps'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setServiceOptionFilter(opt); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors ${serviceOptionFilter === opt ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller Details Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'seller' ? null : 'seller')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>Seller details {sellerLevelFilter !== 'All' ? `(${sellerLevelFilter})` : ''}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'seller' ? 'rotate-270' : 'rotate-90'} text-slate-400`} />
                  </button>
                  {activeDropdown === 'seller' && (
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                      {['All', 'Top Rated', 'Level 2', 'Level 1'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => { setSellerLevelFilter(lvl); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors ${sellerLevelFilter === lvl ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budget Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>Budget {budgetFilter !== 'All' ? `(${budgetFilter})` : ''}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'budget' ? 'rotate-270' : 'rotate-90'} text-slate-400`} />
                  </button>
                  {activeDropdown === 'budget' && (
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                      {[
                        { label: 'Any Budget', value: 'All' },
                        { label: 'Under $500', value: 'under_500' },
                        { label: '$500 - $1,000', value: '500_1000' },
                        { label: '$1,000+', value: '1000_plus' },
                      ].map(b => (
                        <button
                          key={b.value}
                          onClick={() => { setBudgetFilter(b.value); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors ${budgetFilter === b.value ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Time Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'delivery' ? null : 'delivery')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>Delivery time {deliveryTimeFilter !== null ? `(≤ ${deliveryTimeFilter}d)` : ''}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'delivery' ? 'rotate-270' : 'rotate-90'} text-slate-400`} />
                  </button>
                  {activeDropdown === 'delivery' && (
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                      {[
                        { label: 'Any Delivery Time', value: null },
                        { label: 'Up to 3 Days', value: 3 },
                        { label: 'Up to 5 Days', value: 5 },
                        { label: 'Up to 10 Days', value: 10 },
                      ].map(d => (
                        <button
                          key={String(d.value)}
                          onClick={() => { setDeliveryTimeFilter(d.value); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors ${deliveryTimeFilter === d.value ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={onlineNowOnly}
                    onChange={(e) => setOnlineNowOnly(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                  />
                  <span>Online now</span>
                </label>
              </div>
            </div>

            {/* Categories Filter Tabs with Search-Engine-Friendly URLs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              {['All', 'Development & IT', 'AI & Data', 'Design & Creative', 'Mobile Apps'].map(catName => {
                const slug = CATEGORY_SLUGS[catName];
                const catUrl = slug === 'all' ? '/gigs' : `/categories/${slug}`;
                const isActive = currentCategory === catName;
                return (
                  <a
                    key={catName}
                    href={catUrl}
                    onClick={(e) => navigate(catUrl, e)}
                    className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    {catName}
                  </a>
                );
              })}
            </div>

            {/* Gigs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredGigs.map(gig => (
                <a 
                  key={gig.id} 
                  href={getGigUrl(gig)}
                  onClick={(e) => navigate(getGigUrl(gig), e)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img 
                      src={gig.image} 
                      alt={gig.title} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert('Added to favorites!'); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                    >
                      ♥
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Seller info row */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <img src={gig.freelancerAvatar} alt={gig.freelancerName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900">{gig.freelancerName}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{gig.freelancerLevel || 'Top Rated'}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-normal text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors mb-3 leading-snug">
                        {gig.title}
                      </h3>
                    </div>

                    <div>
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900 mb-3">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{gig.rating}</span>
                        <span className="text-slate-400 font-normal">({gig.reviewsCount > 999 ? (gig.reviewsCount/1000).toFixed(1) + 'k' : gig.reviewsCount})</span>
                      </div>

                      {/* Price */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs uppercase font-semibold text-slate-400">Starting at</span>
                        <span className="text-base font-extrabold text-slate-950">₹{(gig.price * 83).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: GIG INNER DETAIL PAGE (Fiverr URL Format: /:username/:slug) */}
        {isGigDetail && currentGig && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <a href="/gigs" onClick={(e) => navigate('/gigs', e)} className="hover:text-slate-900">Home</a>
              <span>/</span>
              <a href={`/categories/${CATEGORY_SLUGS[currentGig.category] || 'development-it'}`} onClick={(e) => navigate(`/categories/${CATEGORY_SLUGS[currentGig.category] || 'development-it'}`, e)} className="hover:text-slate-900">
                {currentGig.category}
              </a>
              <span>/</span>
              <span className="text-slate-900 font-semibold truncate max-w-xs">{currentGig.subcategory || 'Services'}</span>
            </div>

            {/* Title & Seller Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
                {currentGig.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <img src={currentGig.freelancerAvatar} alt={currentGig.freelancerName} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
                  <div>
                    <span className="font-bold text-slate-900 block">{currentGig.freelancerName}</span>
                    <span className="text-slate-500 font-mono">@{currentGig.freelancerUsername || slugify(currentGig.freelancerName)}</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{currentGig.rating}</span>
                  <span className="text-slate-400 font-normal">({currentGig.reviewsCount.toLocaleString()} reviews)</span>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md text-[11px]">
                  {currentGig.freelancerLevel || 'Top Rated Seller'}
                </span>

                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2.5 py-1 rounded-md text-[11px]">
                  3 orders in queue
                </span>
              </div>
            </div>

            {/* Main Content Grid: Gallery & Description Left, Package Box Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* LEFT COLUMN: Gallery & Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Main Media Preview */}
                <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                  <img 
                    src={currentGig.image} 
                    alt={currentGig.title} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=500&fit=crop';
                    }}
                    className="w-full aspect-video object-cover" 
                  />
                </div>

                {/* About This Gig */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
                  <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">About This Gig</h2>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {currentGig.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">Service Category</span>
                      <span>{currentGig.category}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">Subcategory</span>
                      <span>{currentGig.subcategory || 'General'}</span>
                    </div>
                  </div>
                </div>

                {/* About The Seller */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
                  <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">About The Seller</h2>
                  
                  <div className="flex items-center gap-4">
                    <img src={currentGig.freelancerAvatar} alt={currentGig.freelancerName} className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-100" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{currentGig.freelancerName}</h3>
                      <p className="text-xs text-slate-500 font-mono">@{currentGig.freelancerUsername || slugify(currentGig.freelancerName)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {currentGig.rating}
                        </span>
                        <span className="text-xs text-slate-400">({currentGig.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">From</span>
                      <span className="font-bold text-slate-800">United States</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Member since</span>
                      <span className="font-bold text-slate-800">Jan 2024</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Avg. response time</span>
                      <span className="font-bold text-slate-800">1 hour</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Last delivery</span>
                      <span className="font-bold text-slate-800">about 2 hours</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleContactSeller(currentGig.freelancerId, currentGig.freelancerName, currentGig.title)}
                    className="w-full sm:w-auto px-6 py-2.5 border-2 border-slate-900 text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Contact Seller ({currentGig.freelancerName})</span>
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: Simple Order Box with Optional Extras */}
              <div className="lg:col-span-1 sticky top-24">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-6">
                  {(() => {
                    const extrasList = currentGig.extras || [];
                    const selectedExtrasObjects = extrasList.filter(e => selectedExtras.includes(e.id));
                    const extrasTotalUSD = selectedExtrasObjects.reduce((sum, e) => sum + e.price, 0);
                    const totalUSD = currentGig.price + extrasTotalUSD;
                    const totalINR = totalUSD * 83;

                    return (
                      <>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gig Base Price</span>
                            <span className="text-2xl font-extrabold text-slate-900">₹{(currentGig.price * 83).toLocaleString()}</span>
                          </div>
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                            ${currentGig.price} USD
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{currentGig.deliveryDays} Days Delivery</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                            <span>Unlimited Revisions</span>
                          </div>
                        </div>

                        {/* Optional Gig Extras Section */}
                        {extrasList.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Upgrade Your Order with Extras:
                            </h4>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {extrasList.map(extra => {
                                const isChecked = selectedExtras.includes(extra.id);
                                return (
                                  <label 
                                    key={extra.id} 
                                    className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${isChecked ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedExtras(prev => [...prev, extra.id]);
                                        } else {
                                          setSelectedExtras(prev => prev.filter(id => id !== extra.id));
                                        }
                                      }}
                                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                                    />
                                    <div className="flex-1 flex items-center justify-between gap-2">
                                      <span>{extra.title}</span>
                                      <span className="font-extrabold text-slate-900 shrink-0">+₹{(extra.price * 83).toLocaleString()}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Total Summary */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 block font-medium">Total Escrow Amount</span>
                            {selectedExtras.length > 0 && (
                              <span className="text-[10px] text-emerald-600 font-semibold block">Includes {selectedExtras.length} selected extra(s)</span>
                            )}
                          </div>
                          <span className="text-2xl font-extrabold text-slate-950">₹{totalINR.toLocaleString()}</span>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>100% Escrow Protection. Funds are safely held until work is delivered and approved.</span>
                        </div>

                        <button 
                          onClick={() => handleCreateOrder(
                            `${currentGig.title}${selectedExtrasObjects.length > 0 ? ` (with ${selectedExtrasObjects.length} extra add-ons)` : ''}`, 
                            totalUSD, 
                            currentGig.freelancerId
                          )}
                          className="w-full py-4 bg-emerald-500 text-slate-950 font-extrabold rounded-2xl hover:bg-emerald-400 transition-colors shadow-md text-xs flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Fund ₹{totalINR.toLocaleString()} in Escrow & Order Now</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: BUYER REQUESTS / PROJECTS LIST */}
        {isProjectsList && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buyer Project Requests</h1>
                <p className="text-sm text-slate-500">Browse open client projects and submit custom proposals.</p>
              </div>
              <a 
                href="/post-project"
                onClick={(e) => navigate('/post-project', e)}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Post New Project</span>
              </a>
            </div>

            <div className="space-y-4">
              {projects.map(proj => (
                <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <img src={proj.buyerAvatar} alt={proj.buyerName} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{proj.buyerName}</span>
                        <span className="text-[11px] text-slate-400">Posted {proj.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Budget</span>
                        <span className="text-sm font-extrabold text-slate-900">${proj.budgetMin} - ${proj.budgetMax}</span>
                      </div>
                      <a 
                        href={`/projects/${proj.id}`}
                        onClick={(e) => navigate(`/projects/${proj.id}`, e)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-xs"
                      >
                        Submit Proposal
                      </a>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{proj.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{proj.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">{proj.category}</span>
                    <span>·</span>
                    <span>{proj.proposalsCount} proposals submitted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: PROJECT PROPOSAL PAGE (Clean URL /projects/:id) */}
        {isProjectDetail && currentProject && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <a href="/projects" onClick={(e) => navigate('/projects', e)} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Buyer Requests
            </a>

            <div className="mb-6">
              <span className="text-xs font-semibold text-emerald-600 block mb-1">Project Proposal</span>
              <h1 className="text-xl font-extrabold text-slate-900 mb-2">{currentProject.title}</h1>
              <p className="text-sm text-slate-600">{currentProject.description}</p>
            </div>

            <form onSubmit={(e) => handleSubmitProposal(e, currentProject.id)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your Bid ($)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1200"
                    value={proposalBid}
                    onChange={(e) => setProposalBid(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Delivery (Days)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 14"
                    value={proposalDays}
                    onChange={(e) => setProposalDays(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Cover Letter</label>
                  <button 
                    type="button"
                    onClick={() => handleGenerateAIProposal(currentProject.title, currentProject.description)}
                    disabled={isGeneratingAIProposal}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAIProposal ? 'Generating AI Cover Letter...' : 'Write with Gemini AI'}</span>
                  </button>
                </div>
                <textarea 
                  rows={6}
                  placeholder="Explain why you are the best fit for this project..."
                  value={proposalCover}
                  onChange={(e) => setProposalCover(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md">
                Submit Proposal to Buyer
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: MY ORDERS & ESCROW (/orders) */}
        {isOrders && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Orders & Escrow Vault</h1>
              <p className="text-sm text-slate-500">Track milestones, secure escrow funds, and deliver completed work.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                {orders.map(ord => (
                  <div 
                    key={ord.id}
                    onClick={() => { setSelectedOrder(ord); fetchMessages(ord.id); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedOrder?.id === ord.id ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedOrder?.id === ord.id ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-50 text-emerald-700'}`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-sm font-extrabold ${selectedOrder?.id === ord.id ? 'text-emerald-400' : 'text-slate-900'}`}>${ord.amount}</span>
                    </div>
                    <h4 className="text-sm font-bold mb-3 line-clamp-1">{ord.title}</h4>
                    <div className={`flex items-center justify-between text-xs ${selectedOrder?.id === ord.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span>Due: {ord.dueDate}</span>
                      <span>Order #{ord.id}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                {selectedOrder ? (
                  <div>
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                      <div>
                        <span className="text-xs font-semibold text-emerald-600 block mb-1">Escrow Secured</span>
                        <h2 className="text-xl font-bold text-slate-900">{selectedOrder.title}</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
                        <span className="text-xl font-extrabold text-slate-900">${selectedOrder.amount}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 mb-6 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900">
                        <span className="font-bold block mb-1">WorkPerHour Escrow Protection Active</span>
                        Funds are safely locked in escrow and will only be released to the seller once milestones are successfully delivered and approved.
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Requirements</h3>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        {selectedOrder.requirements || 'No specific requirements notes provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a 
                        href="/messages"
                        onClick={(e) => navigate('/messages', e)}
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Open Live Chat</span>
                      </a>
                      <button 
                        onClick={() => {
                          setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'completed' } : o));
                          alert('Milestone approved and escrow funds released to seller!');
                        }}
                        className="px-5 py-2.5 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Release Escrow</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">Select an order to view escrow details.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: LIVE CHAT HUB (/messages) */}
        {isMessages && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 h-[650px]">
            <div className="border-r border-slate-200 p-4 overflow-y-auto bg-slate-50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Active Conversations</h3>
              <div className="space-y-2">
                {orders.map(ord => (
                  <div 
                    key={ord.id}
                    onClick={() => { setSelectedOrder(ord); fetchMessages(ord.id); }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all ${selectedOrder?.id === ord.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-100 border border-slate-200/60'}`}
                  >
                    <span className="text-xs font-bold block mb-1">{ord.title}</span>
                    <span className={`text-[11px] ${selectedOrder?.id === ord.id ? 'text-emerald-400' : 'text-slate-500'}`}>Order #{ord.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between h-full bg-white">
              {selectedOrder ? (
                <>
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedOrder.title}</h3>
                      <span className="text-[11px] text-emerald-600 font-medium">Live WebSocket Connected</span>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">${selectedOrder.amount} Escrow</span>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/30">
                    {messages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-slate-600">{msg.senderName}</span>
                            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                          </div>
                          <div className={`p-3.5 rounded-2xl text-sm max-w-md ${isMe ? 'bg-slate-900 text-white rounded-br-xs' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Type a message to buyer/seller..." 
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button type="submit" className="px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select an order to start messaging.</div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: CREATE GIG STUDIO (/create-gig) */}
        {isCreateGig && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create a New Service Gig</h1>
              <p className="text-sm text-slate-500">Publish your freelance service and leverage Gemini AI to optimize conversion.</p>
            </div>

            <form onSubmit={handlePublishGig} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gig Title</label>
                <input 
                  type="text" 
                  placeholder="I will build a high-performance web app..."
                  value={newGigTitle}
                  onChange={(e) => setNewGigTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={newGigCat}
                  onChange={(e) => setNewGigCat(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                >
                  <option value="Development & IT">Development & IT</option>
                  <option value="AI & Data">AI & Data</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Mobile Apps">Mobile Apps</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                  <button 
                    type="button"
                    onClick={handleOptimizeGigWithAI}
                    disabled={isOptimizingGig}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isOptimizingGig ? 'Optimizing with Gemini...' : 'Optimize with Gemini AI'}</span>
                  </button>
                </div>
                <textarea 
                  rows={5}
                  placeholder="Describe your service offering, deliverables, and tech stack..."
                  value={newGigDesc}
                  onChange={(e) => setNewGigDesc(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Base Price ($)</label>
                  <input 
                    type="number" 
                    value={newGigPrice}
                    onChange={(e) => setNewGigPrice(Number(e.target.value))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Delivery Time (Days)</label>
                  <input 
                    type="number" 
                    value={newGigDays}
                    onChange={(e) => setNewGigDays(Number(e.target.value))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Gig Extras Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Configure Optional Gig Extras (Add-ons)
                  </label>
                  <p className="text-xs text-slate-500">Allow buyers to add extra fast delivery, source files, or commercial licenses to their order.</p>
                </div>

                {/* Existing configured extras */}
                {newGigExtras.length > 0 && (
                  <div className="space-y-2">
                    {newGigExtras.map(ext => (
                      <div key={ext.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <span className="font-semibold text-slate-800">{ext.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900">+${ext.price}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveGigExtra(ext.id)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new extra input row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input 
                    type="text" 
                    placeholder="Extra title (e.g. Fast 24h Express Delivery)..." 
                    value={extraTitleInput}
                    onChange={(e) => setExtraTitleInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-500">$</span>
                    <input 
                      type="number" 
                      placeholder="50" 
                      value={extraPriceInput}
                      onChange={(e) => setExtraPriceInput(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={handleAddGigExtra}
                      className="px-3 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 whitespace-nowrap"
                    >
                      + Add Extra
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md">
                Publish Gig to Marketplace
              </button>
            </form>
          </div>
        )}

        {/* VIEW 8: POST PROJECT STUDIO (/post-project) */}
        {isPostProject && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Post a Project Request</h1>
              <p className="text-sm text-slate-500">Describe what you need built and receive custom proposals from top freelancers.</p>
            </div>

            <form onSubmit={handlePostProject} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Need React Native mobile app developer..."
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={newProjCat}
                  onChange={(e) => setNewProjCat(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                >
                  <option value="Development & IT">Development & IT</option>
                  <option value="AI & Data">AI & Data</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Mobile Apps">Mobile Apps</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Description</label>
                <textarea 
                  rows={5}
                  placeholder="Detailed requirements, deliverables, and expectations..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Min Budget ($)</label>
                  <input 
                    type="number" 
                    value={newProjMin}
                    onChange={(e) => setNewProjMin(Number(e.target.value))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Max Budget ($)</label>
                  <input 
                    type="number" 
                    value={newProjMax}
                    onChange={(e) => setNewProjMax(Number(e.target.value))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md">
                Post Project & Notify Freelancers
              </button>
            </form>
          </div>
        )}

      </main>

      {/* EMAIL INBOX & SYSTEM NOTIFICATIONS MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>Official Email Notifications & System Inbox</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official emails dispatched to {(impersonatedUser || currentUser).email} regarding account status, compliance, and security.
                </p>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {userEmails.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No official email notifications found.</div>
              ) : (
                userEmails.map(em => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (em.type === 'SUSPEND') badgeColor = 'bg-red-100 text-red-800 border-red-200';
                  else if (em.type === 'RESTRICT') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  else if (em.type === 'IMPERSONATE') badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';

                  return (
                    <div key={em.id} className={`p-5 rounded-2xl border space-y-3 transition-all ${em.read ? 'bg-slate-50/60 border-slate-200' : 'bg-white border-slate-300 shadow-sm'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${badgeColor}`}>
                          {em.type} NOTICE
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{em.sentAt}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{em.subject}</h4>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                        {em.body}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {!em.read && (
                          <button 
                            onClick={async () => {
                              await fetch(`/api/user-emails/${em.id}/read`, { method: 'PATCH' });
                              fetchUserEmails((impersonatedUser || currentUser).id);
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setIsEmailModalOpen(false);
                            setIsSupportModalOpen(true);
                          }}
                          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors shadow-xs ml-auto flex items-center gap-1.5"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Contact Support Desk</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET SUBMISSION MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  <span>Contact WorkSphere Support Desk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit an appeal, ask questions about restrictions, or request support assistance.</p>
              </div>
              <button 
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateSupportTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Inquiry Subject / Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. Account Status Review / Appeal Request" 
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Message / Explanation</label>
                <textarea 
                  rows={5}
                  placeholder="Please describe your inquiry or appeal details..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition-colors"
                >
                  Submit Support Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div>
            <a href="/gigs" onClick={(e) => navigate('/gigs', e)} className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-base">
                W
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">WorkPerHour</span>
            </a>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              WorkPerHour is a secure freelance marketplace with 100% Escrow payment protection, instant WebSockets chat, and Gemini AI proposal generation.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Escrow Protected</span>
            </div>
          </div>

          {/* Col 2: SEO Category Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Browse Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <a href="/categories/development-it" onClick={(e) => navigate('/categories/development-it', e)} className="hover:text-slate-900 transition-colors">
                  Development & IT
                </a>
              </li>
              <li>
                <a href="/categories/ai-data" onClick={(e) => navigate('/categories/ai-data', e)} className="hover:text-slate-900 transition-colors">
                  AI & Data Science
                </a>
              </li>
              <li>
                <a href="/categories/design-creative" onClick={(e) => navigate('/categories/design-creative', e)} className="hover:text-slate-900 transition-colors">
                  Design & Creative
                </a>
              </li>
              <li>
                <a href="/categories/mobile-apps" onClick={(e) => navigate('/categories/mobile-apps', e)} className="hover:text-slate-900 transition-colors">
                  Mobile Apps
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Marketplace Navigation</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <a href="/gigs" onClick={(e) => navigate('/gigs', e)} className="hover:text-slate-900 transition-colors">
                  Explore All Gigs
                </a>
              </li>
              <li>
                <a href="/projects" onClick={(e) => navigate('/projects', e)} className="hover:text-slate-900 transition-colors">
                  Buyer Requests Board
                </a>
              </li>
              <li>
                <a href="/orders" onClick={(e) => navigate('/orders', e)} className="hover:text-slate-900 transition-colors">
                  My Escrow Orders
                </a>
              </li>
              <li>
                <a href="/messages" onClick={(e) => navigate('/messages', e)} className="hover:text-slate-900 transition-colors">
                  Live Conversations
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Administration */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">System Administration</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <a href="/admin" onClick={(e) => navigate('/admin', e)} className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  <Settings className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Panel Console</span>
                </a>
              </li>
              <li><span className="text-slate-400">Escrow Security Protocols</span></li>
              <li><span className="text-slate-400">Gemini AI Engine Logs</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 WorkPerHour Marketplace Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/admin" onClick={(e) => navigate('/admin', e)} className="font-semibold text-slate-700 hover:text-slate-900">
              Admin Portal
            </a>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
