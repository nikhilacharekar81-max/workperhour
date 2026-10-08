import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'moderator' | 'support';
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

interface GigExtra {
  id: string;
  title: string;
  price: number;
}

interface Gig {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerUsername: string;
  freelancerAvatar: string;
  freelancerLevel: string;
  title: string;
  slug: string;
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
}

interface Project {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadlineDays: number;
  proposalsCount: number;
  createdAt: string;
  status: 'open' | 'in_progress' | 'completed' | 'suspended';
  featured: boolean;
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
  status: 'funded_in_escrow' | 'in_progress' | 'delivered' | 'completed' | 'disputed';
  createdAt: string;
  dueDate: string;
  requirements?: string;
  deliverables?: string;
  escrowProtectionStartDate?: string;
  escrowProtectionEndDate?: string;
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
  method: 'UPI' | 'Bank Transfer' | 'Stripe' | 'Razorpay';
  status: 'pending' | 'processed' | 'failed';
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

let userEmails: UserEmail[] = [
  {
    id: 'email_init_1',
    userId: 'user_1',
    userEmail: 'elena@example.com',
    subject: 'Welcome to WorkPerHour Platform',
    body: 'Welcome Elena! Your freelancer and buyer profile is active.',
    type: 'GENERAL',
    sentAt: '2026-10-01 10:00 AM',
    read: true
  }
];

function notifyUserOnAdminAction(user: User, action: 'suspended' | 'restricted' | 'impersonated', notes?: string) {
  const timestamp = new Date().toLocaleString();
  const timeShort = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let emailSubject = '';
  let emailBody = '';
  let chatText = '';

  if (action === 'suspended') {
    emailSubject = `[URGENT] WorkSphere Account Suspended - Action Required`;
    emailBody = `Dear ${user.name},\n\nYour WorkSphere account (${user.email}) has been SUSPENDED by Platform Administration.\n\nReason/Notes: ${notes || 'Violation of Marketplace Policies / Security Investigation'}.\n\nWhile suspended, your active listings, gigs, and bidding capabilities are temporarily paused. If you believe this is an error or wish to file an appeal, please click "Contact Support Desk" or reply directly to support.`;
    chatText = `🚨 ACCOUNT ALERT: Your WorkSphere account has been SUSPENDED by Platform Administration. Please Contact Support Desk immediately to review your account status and submit an appeal.`;
  } else if (action === 'restricted') {
    emailSubject = `[NOTICE] WorkSphere Account Privileges Restricted`;
    emailBody = `Dear ${user.name},\n\nYour WorkSphere account (${user.email}) privileges have been RESTRICTED by Platform Administration.\n\nReason/Notes: ${notes || 'Account compliance review / policy warning'}.\n\nCertain actions (such as creating new gigs or submitting bids) are currently limited. Please contact our Support Desk to resolve these restrictions.`;
    chatText = `⚠️ ACCOUNT NOTICE: Your WorkSphere account privileges have been RESTRICTED by Platform Administration. Please Contact Support Desk for assistance and clarification.`;
  } else if (action === 'impersonated') {
    emailSubject = `[SECURITY NOTICE] Administrative Support Session Initialized`;
    emailBody = `Dear ${user.name},\n\nA Super Administrator initialized an Administrative Support Impersonation Session for your account (${user.email}) at ${timestamp} for support investigation and auditing.\n\nIf you have any questions or security concerns, please contact support immediately.`;
    chatText = `🔒 SECURITY NOTICE: An Administrative Support Impersonation Session was started for your account by Super Admin for inspection. Please contact support if you have any questions.`;
  }

  // 1. Store Email Record
  const newEmail: UserEmail = {
    id: 'email_' + Date.now() + Math.random().toString(36).substring(2, 5),
    userId: user.id,
    userEmail: user.email,
    subject: emailSubject,
    body: emailBody,
    type: action === 'suspended' ? 'SUSPEND' : action === 'restricted' ? 'RESTRICT' : 'IMPERSONATE',
    sentAt: timestamp,
    read: false
  };
  userEmails.unshift(newEmail);

  // 2. Add System Chat Message into User's Support Thread
  const supportOrderId = `support_admin_${user.id}`;
  const newChatMsg: Message = {
    id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
    orderId: supportOrderId,
    senderId: 'user_admin',
    senderName: 'WorkSphere Admin & Support Desk',
    text: chatText,
    timestamp: timeShort
  };
  messages.push(newChatMsg);

  // 3. Broadcast WS message
  try {
    const payload = JSON.stringify({ type: 'MESSAGE_RECEIVED', message: newChatMsg });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  } catch (err) {
    console.error('WS notify error:', err);
  }
}

// Initial Data Seeds
let users: User[] = [
  {
    id: 'user_1',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    title: 'Senior Full-Stack & UI/UX Architect',
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
  },
  {
    id: 'user_2',
    name: 'Marcus Vance',
    email: 'marcus@example.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    title: 'VP of Product at NexusTech',
    rating: 5.0,
    reviewsCount: 28,
    hourlyRate: 0,
    earned: 0,
    completedJobs: 0,
    bio: 'Looking for elite freelance developers.',
    skills: ['Product Management', 'Startup Growth'],
    status: 'active',
    verified: true,
    walletBalance: 12000,
    createdAt: '2025-02-01'
  },
  {
    id: 'user_admin',
    name: 'Admin Chief',
    email: 'admin@workperhour.com',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    title: 'Platform Super Administrator',
    rating: 5.0,
    reviewsCount: 0,
    hourlyRate: 0,
    earned: 0,
    completedJobs: 0,
    bio: 'Super Admin managing marketplace integrity.',
    skills: ['Platform Operations', 'Security'],
    status: 'active',
    verified: true,
    walletBalance: 0,
    createdAt: '2025-01-01'
  }
];

let gigs: Gig[] = [
  {
    id: 'gig_0',
    freelancerId: 'user_bk',
    freelancerName: 'Broadcast King',
    freelancerUsername: 'broadcastking',
    freelancerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    freelancerLevel: 'Top Rated ★★★',
    title: 'Create an amazing promotional explainer video a puppet',
    slug: 'create-an-amazing-promotional-explainer-video-a-puppet',
    category: 'Design & Creative',
    subcategory: 'Explainer Videos',
    description: 'I will create a high quality 1080p promotional explainer video featuring a custom puppet character for your brand or business. Includes professional voiceover, sound effects, commercial rights, and unlimited revisions.',
    price: 450,
    deliveryDays: 3,
    rating: 4.9,
    reviewsCount: 2840,
    image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=500&fit=crop',
    status: 'published',
    featured: true,
    extras: [
      { id: 'ext_1', title: 'Extra Fast 24-Hour Express Delivery', price: 100 },
      { id: 'ext_2', title: 'Full Commercial & Broadcast License', price: 150 },
      { id: 'ext_3', title: 'Additional 30 Seconds Animation', price: 200 },
      { id: 'ext_4', title: 'Custom Background Music Track', price: 50 }
    ]
  },
  {
    id: 'gig_1',
    freelancerId: 'user_1',
    freelancerName: 'Jacob M.',
    freelancerUsername: 'jacob_m',
    freelancerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    freelancerLevel: 'Top Rated ★★★',
    title: 'I will seo backlinks high da authority link building service for google ranking',
    slug: 'i-will-seo-backlinks-high-da-authority-link-building-service-for-google-ranking',
    category: 'Development & IT',
    subcategory: 'SEO & Link Building',
    description: 'Get high DA authority backlinks and contextual link building to boost your Google rankings safely.',
    price: 450,
    deliveryDays: 5,
    rating: 4.9,
    reviewsCount: 1420,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop',
    status: 'published',
    featured: true,
    extras: [
      { id: 'ext_5', title: 'Supercharge with 25 Extra High DA 70+ Backlinks', price: 200 },
      { id: 'ext_6', title: 'Detailed PDF Indexing & Anchor Text Report', price: 50 }
    ]
  },
  {
    id: 'gig_2',
    freelancerId: 'user_3',
    freelancerName: 'BUSHRA',
    freelancerUsername: 'bushra',
    freelancerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    freelancerLevel: 'Level 2 ★★',
    title: 'I will increase ahrefs domain rating dr 70 using high authority SEO backlinks',
    slug: 'i-will-increase-ahrefs-domain-rating-dr-70-using-high-authority-seo-backlinks',
    category: 'AI & Data',
    subcategory: 'AI Integration',
    description: 'Supercharge your domain rating with Ahrefs DR 70 guaranteed backlinks.',
    price: 350,
    deliveryDays: 3,
    rating: 5.0,
    reviewsCount: 16,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop',
    status: 'published',
    featured: false,
    extras: [
      { id: 'ext_7', title: 'Fast Track Processing (2 Days Delivery)', price: 150 },
      { id: 'ext_8', title: 'Ahrefs & SEMrush SEO Competitor Comparison', price: 80 }
    ]
  },
  {
    id: 'gig_3',
    freelancerId: 'user_1',
    freelancerName: 'Elena Rostova',
    freelancerUsername: 'elena_rostova',
    freelancerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    freelancerLevel: 'Vetted Pro ★★★',
    title: 'I will build a high performance full stack web app in react and node',
    slug: 'i-will-build-a-high-performance-full-stack-web-app-in-react-and-node',
    category: 'Development & IT',
    subcategory: 'Full-Stack Development',
    description: 'Custom full-stack web applications built with React 19, TypeScript, Express, and PostgreSQL.',
    price: 950,
    deliveryDays: 7,
    rating: 5.0,
    reviewsCount: 382,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
    status: 'published',
    featured: true,
    extras: [
      { id: 'ext_9', title: 'Add Real-Time WebSockets Messaging System', price: 350 },
      { id: 'ext_10', title: 'Stripe & Escrow Payment Gateway Integration', price: 400 },
      { id: 'ext_11', title: 'Express Deployment to Cloud Hosting', price: 150 }
    ]
  }
];

let projects: Project[] = [
  {
    id: 'proj_1',
    buyerId: 'user_2',
    buyerName: 'Marcus Vance',
    buyerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    title: 'Looking for a React Native Expert to build an iOS/Android fintech mobile app',
    category: 'Mobile Apps',
    subcategory: 'React Native',
    description: 'Launching a next-gen crypto & fiat savings wallet with biometric auth & Stripe.',
    budgetMin: 3000,
    budgetMax: 6000,
    deadlineDays: 30,
    proposalsCount: 4,
    createdAt: '2026-10-01',
    status: 'open',
    featured: true
  }
];

let proposals: Proposal[] = [
  {
    id: 'prop_1',
    projectId: 'proj_1',
    freelancerId: 'user_1',
    freelancerName: 'Elena Rostova',
    freelancerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    freelancerTitle: 'Senior Full-Stack & UI/UX Architect',
    coverLetter: 'Hi Marcus! I have built several secure fintech apps.',
    bidAmount: 4500,
    deliveryDays: 25,
    createdAt: '2026-10-02',
    status: 'pending'
  }
];

let orders: Order[] = [
  {
    id: 'ord_1',
    title: 'Full-Stack SaaS MVP Development',
    buyerId: 'user_2',
    sellerId: 'user_1',
    amount: 950,
    status: 'funded_in_escrow',
    createdAt: '2026-10-05',
    dueDate: '2026-10-19',
    requirements: 'Build user dashboard with dark mode and PostgreSQL.',
    escrowProtectionStartDate: '2026-10-05',
    escrowProtectionEndDate: '2026-10-19'
  },
  {
    id: 'ord_bk',
    title: 'Promotional Explainer Video Puppet',
    buyerId: 'user_2',
    sellerId: 'user_bk',
    amount: 450,
    status: 'in_progress',
    createdAt: '2026-10-06',
    dueDate: '2026-10-12',
    requirements: '30-second puppet animation for mobile app launch.',
    escrowProtectionStartDate: '2026-10-06',
    escrowProtectionEndDate: '2026-10-20'
  },
  {
    id: 'ord_bushra',
    title: 'Ahrefs DR 70 SEO Backlinks Campaign',
    buyerId: 'user_2',
    sellerId: 'user_3',
    amount: 350,
    status: 'in_progress',
    createdAt: '2026-10-07',
    dueDate: '2026-10-14',
    requirements: 'Target domain ranking boost for SaaS landing page.',
    escrowProtectionStartDate: '2026-10-07',
    escrowProtectionEndDate: '2026-10-21'
  }
];

let disputes: Dispute[] = [
  {
    id: 'disp_1',
    orderId: 'ord_1',
    raisedBy: 'user_2',
    reason: 'Deliverable delay and missing dark mode toggle requirement.',
    evidence: 'Screenshot of dashboard preview missing dark theme switch.',
    status: 'under_investigation',
    createdAt: '2026-10-07',
    assignedTo: 'user_admin'
  }
];

let refunds: Refund[] = [
  {
    id: 'ref_1',
    orderId: 'ord_1',
    buyerId: 'user_2',
    amount: 250,
    reason: 'Partial refund requested due to reduced scope.',
    status: 'pending',
    createdAt: '2026-10-07'
  }
];

let payouts: Payout[] = [
  {
    id: 'pay_1',
    freelancerId: 'user_1',
    amount: 1500,
    method: 'UPI',
    status: 'processed',
    createdAt: '2026-10-04',
    accountDetails: 'elena@upi'
  }
];

let categories: Category[] = [
  {
    id: 'cat_1',
    name: 'Development & IT',
    slug: 'development-it',
    enabled: true,
    order: 1,
    subcategories: [
      { id: 'sub_1', name: 'Web Development', slug: 'web-dev', enabled: true },
      { id: 'sub_2', name: 'SEO & Link Building', slug: 'seo', enabled: true }
    ]
  },
  {
    id: 'cat_2',
    name: 'AI & Data',
    slug: 'ai-data',
    enabled: true,
    order: 2,
    subcategories: [
      { id: 'sub_3', name: 'AI Integration', slug: 'ai-integration', enabled: true },
      { id: 'sub_4', name: 'Data Science', slug: 'data-science', enabled: true }
    ]
  },
  {
    id: 'cat_3',
    name: 'Design & Creative',
    slug: 'design-creative',
    enabled: true,
    order: 3,
    subcategories: [
      { id: 'sub_5', name: 'Explainer Videos', slug: 'explainer-videos', enabled: true },
      { id: 'sub_6', name: 'UI/UX Design', slug: 'ui-ux-design', enabled: true }
    ]
  },
  {
    id: 'cat_4',
    name: 'Mobile Apps',
    slug: 'mobile-apps',
    enabled: true,
    order: 4,
    subcategories: [
      { id: 'sub_7', name: 'React Native', slug: 'react-native', enabled: true },
      { id: 'sub_8', name: 'iOS & Android', slug: 'ios-android', enabled: true }
    ]
  }
];

let reviews: Review[] = [
  {
    id: 'rev_1',
    orderId: 'ord_1',
    reviewerName: 'Marcus Vance',
    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    targetUserId: 'user_1',
    rating: 5,
    comment: 'Exceptional work! Elena delivered clean React code ahead of schedule.',
    createdAt: '2026-10-06'
  }
];

let supportTickets: SupportTicket[] = [
  {
    id: 'tick_1',
    userId: 'user_1',
    userName: 'Elena Rostova',
    subject: 'Question regarding withdrawal payout fees',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-10-07',
    messages: [
      { sender: 'Elena Rostova', text: 'Hi support team, what is the fee rate for UPI payouts?', timestamp: '11:20 AM' }
    ]
  }
];

let auditLogs: AuditLog[] = [
  {
    id: 'log_1',
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'FORCE_ESCROW_RELEASE',
    target: 'Order #ord_1',
    details: 'Released $950 escrow to Elena Rostova after milestone sign-off.',
    timestamp: '2026-10-08 02:15 AM'
  }
];

let messages: Message[] = [
  {
    id: 'msg_1',
    orderId: 'ord_1',
    senderId: 'user_2',
    senderName: 'Marcus Vance',
    text: 'Hi Elena, excited to get started! Funds secured in escrow.',
    timestamp: '10:30 AM'
  },
  {
    id: 'msg_2',
    orderId: 'ord_1',
    senderId: 'user_1',
    senderName: 'Elena Rostova',
    text: 'Thanks Marcus! Initial architecture and UI wireframes are ready.',
    timestamp: '10:35 AM'
  },
  {
    id: 'msg_3',
    orderId: 'ord_bk',
    senderId: 'user_2',
    senderName: 'Marcus Vance',
    text: 'Hi Broadcast King! Looking forward to the puppet explainer video preview.',
    timestamp: '02:15 PM'
  },
  {
    id: 'msg_4',
    orderId: 'ord_bk',
    senderId: 'user_bk',
    senderName: 'Broadcast King',
    text: 'Hello Marcus! Character rigging is complete and voiceover is recorded.',
    timestamp: '02:20 PM'
  },
  {
    id: 'msg_5',
    orderId: 'ord_bushra',
    senderId: 'user_2',
    senderName: 'Marcus Vance',
    text: 'Hi Bushra, checking in on the SEO DR 70 backlinks report.',
    timestamp: '04:10 PM'
  },
  {
    id: 'msg_6',
    orderId: 'ord_bushra',
    senderId: 'user_3',
    senderName: 'BUSHRA',
    text: 'Hello Marcus! Backlink indexing is underway, sending the initial Ahrefs report shortly.',
    timestamp: '04:15 PM'
  }
];

// REST API Endpoints
app.get('/api/users', (req, res) => res.json(users));
app.get('/api/gigs', (req, res) => res.json(gigs));
app.get('/api/projects', (req, res) => res.json(projects));
app.get('/api/proposals', (req, res) => res.json(proposals));
app.get('/api/orders', (req, res) => res.json(orders));
app.get('/api/disputes', (req, res) => res.json(disputes));
app.get('/api/refunds', (req, res) => res.json(refunds));
app.get('/api/payouts', (req, res) => res.json(payouts));
app.get('/api/categories', (req, res) => res.json(categories));

// Category CRUD Endpoints
app.post('/api/admin/categories', (req, res) => {
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const catSlug = slug || name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  const newCat: Category = {
    id: 'cat_' + Date.now(),
    name,
    slug: catSlug,
    enabled: true,
    order: categories.length + 1,
    subcategories: []
  };
  categories.push(newCat);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'CATEGORY_CREATED',
    target: `Category: ${name}`,
    details: `Created new main category "${name}" with slug /${catSlug}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.post('/api/admin/categories/bulk-delete', (req, res) => {
  const { categoryIds = [], subcategoryPairs = [] } = req.body;
  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    categories = categories.filter(c => !categoryIds.includes(c.id));
  }
  if (Array.isArray(subcategoryPairs) && subcategoryPairs.length > 0) {
    subcategoryPairs.forEach(({ catId, subId }: { catId: string; subId: string }) => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        cat.subcategories = cat.subcategories.filter(s => s.id !== subId);
      }
    });
  }

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'CATEGORIES_BULK_DELETED',
    target: 'Marketplace Categories',
    details: `Bulk deleted ${categoryIds.length} categories and ${subcategoryPairs.length} subcategories`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.patch('/api/admin/categories/:id', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  if (req.body.name) cat.name = req.body.name;
  if (req.body.slug) cat.slug = req.body.slug;
  if (typeof req.body.enabled === 'boolean') cat.enabled = req.body.enabled;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'CATEGORY_UPDATED',
    target: `Category: ${cat.name}`,
    details: `Updated category name/slug/status for ${cat.name}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.patch('/api/admin/categories/:id/toggle', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  cat.enabled = !cat.enabled;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: cat.enabled ? 'CATEGORY_ENABLED' : 'CATEGORY_DISABLED',
    target: `Category: ${cat.name}`,
    details: `Toggled status of category ${cat.name} to ${cat.enabled ? 'Enabled' : 'Disabled'}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });
  const deleted = categories[index];
  categories.splice(index, 1);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'CATEGORY_DELETED',
    target: `Category: ${deleted.name}`,
    details: `Deleted category ${deleted.name}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

// Subcategory CRUD Endpoints
app.post('/api/admin/categories/:id/subcategories', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Parent category not found' });
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ error: 'Subcategory name is required' });
  const subSlug = slug || name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  const newSub = {
    id: 'sub_' + Date.now(),
    name,
    slug: subSlug,
    enabled: true
  };
  cat.subcategories.push(newSub);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'SUBCATEGORY_CREATED',
    target: `Subcategory: ${name} (under ${cat.name})`,
    details: `Created subcategory ${name}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.patch('/api/admin/categories/:id/subcategories/:subId', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Parent category not found' });
  const sub = cat.subcategories.find(s => s.id === req.params.subId);
  if (!sub) return res.status(404).json({ error: 'Subcategory not found' });
  if (req.body.name) sub.name = req.body.name;
  if (req.body.slug) sub.slug = req.body.slug;
  if (typeof req.body.enabled === 'boolean') sub.enabled = req.body.enabled;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'SUBCATEGORY_UPDATED',
    target: `Subcategory: ${sub.name}`,
    details: `Updated subcategory under ${cat.name}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.patch('/api/admin/categories/:id/subcategories/:subId/toggle', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Parent category not found' });
  const sub = cat.subcategories.find(s => s.id === req.params.subId);
  if (!sub) return res.status(404).json({ error: 'Subcategory not found' });
  sub.enabled = !sub.enabled;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: sub.enabled ? 'SUBCATEGORY_ENABLED' : 'SUBCATEGORY_DISABLED',
    target: `Subcategory: ${sub.name}`,
    details: `Toggled subcategory status to ${sub.enabled ? 'Enabled' : 'Disabled'}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});

app.delete('/api/admin/categories/:id/subcategories/:subId', (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Parent category not found' });
  const subIndex = cat.subcategories.findIndex(s => s.id === req.params.subId);
  if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found' });
  const deletedSub = cat.subcategories[subIndex];
  cat.subcategories.splice(subIndex, 1);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'SUBCATEGORY_DELETED',
    target: `Subcategory: ${deletedSub.name}`,
    details: `Deleted subcategory from ${cat.name}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(categories);
});
app.get('/api/reviews', (req, res) => res.json(reviews));
app.get('/api/support-tickets', (req, res) => res.json(supportTickets));
app.get('/api/audit-logs', (req, res) => res.json(auditLogs));

// User Email Notifications API
app.get('/api/user-emails/:userId', (req, res) => {
  const userList = userEmails.filter(e => e.userId === req.params.userId);
  res.json(userList);
});

app.patch('/api/user-emails/:id/read', (req, res) => {
  const em = userEmails.find(e => e.id === req.params.id);
  if (em) em.read = true;
  res.json({ success: true });
});

// User Support Ticket Creation API
app.post('/api/support-tickets', (req, res) => {
  const { userId, userName, subject, text, priority = 'medium' } = req.body;
  const newTicket: SupportTicket = {
    id: 'tick_' + Date.now(),
    userId: userId || 'user_1',
    userName: userName || 'Elena Rostova',
    subject: subject || 'General Support Query',
    priority,
    status: 'open',
    createdAt: new Date().toISOString().split('T')[0],
    messages: [
      { sender: userName || 'Elena Rostova', text: text || 'I need support assistance regarding my account.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]
  };
  supportTickets.unshift(newTicket);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: userName || 'User',
    role: 'user',
    action: 'SUPPORT_TICKET_OPENED',
    target: `Ticket #${newTicket.id}`,
    details: `User submitted support request: ${subject}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(newTicket);
});

app.get('/api/messages/:orderId', (req, res) => {
  const filtered = messages.filter(m => m.orderId === req.params.orderId);
  res.json(filtered);
});

app.post('/api/messages', (req, res) => {
  const newMsg: Message = {
    id: 'msg_' + Date.now(),
    orderId: req.body.orderId,
    senderId: req.body.senderId || 'user_2',
    senderName: req.body.senderName || 'Marcus Vance',
    text: req.body.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  messages.push(newMsg);
  res.json(newMsg);
});

app.post('/api/gigs', (req, res) => {
  const newGig: Gig = {
    id: 'gig_' + Date.now(),
    freelancerId: req.body.freelancerId || 'user_1',
    freelancerName: req.body.freelancerName || 'Elena Rostova',
    freelancerUsername: req.body.freelancerUsername || 'elena_rostova',
    freelancerAvatar: req.body.freelancerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    freelancerLevel: req.body.freelancerLevel || 'Level 1 ★',
    title: req.body.title,
    slug: req.body.title ? req.body.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : 'custom-gig',
    category: req.body.category || 'Development & IT',
    subcategory: req.body.subcategory || 'General',
    description: req.body.description,
    price: Number(req.body.price),
    deliveryDays: Number(req.body.deliveryDays),
    rating: 5.0,
    reviewsCount: 1,
    image: req.body.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
    status: 'published',
    featured: false,
    extras: req.body.extras || []
  };
  gigs.unshift(newGig);
  res.json(newGig);
});

app.post('/api/projects', (req, res) => {
  const newProj: Project = {
    id: 'proj_' + Date.now(),
    buyerId: req.body.buyerId || 'user_2',
    buyerName: req.body.buyerName || 'Marcus Vance',
    buyerAvatar: req.body.buyerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    title: req.body.title,
    category: req.body.category || 'Development & IT',
    subcategory: req.body.subcategory || 'General',
    description: req.body.description,
    budgetMin: Number(req.body.budgetMin),
    budgetMax: Number(req.body.budgetMax),
    deadlineDays: 14,
    proposalsCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
    status: 'open',
    featured: false
  };
  projects.unshift(newProj);
  res.json(newProj);
});

app.post('/api/proposals', (req, res) => {
  const newProp: Proposal = {
    id: 'prop_' + Date.now(),
    projectId: req.body.projectId,
    freelancerId: req.body.freelancerId || 'user_1',
    freelancerName: req.body.freelancerName || 'Elena Rostova',
    freelancerAvatar: req.body.freelancerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    freelancerTitle: req.body.freelancerTitle || 'Senior Engineer',
    coverLetter: req.body.coverLetter,
    bidAmount: Number(req.body.bidAmount),
    deliveryDays: Number(req.body.deliveryDays),
    createdAt: new Date().toISOString().split('T')[0],
    status: 'pending'
  };
  proposals.unshift(newProp);
  const proj = projects.find(p => p.id === req.body.projectId);
  if (proj) proj.proposalsCount += 1;
  res.json(newProp);
});

app.post('/api/orders', (req, res) => {
  const newOrd: Order = {
    id: 'ord_' + Date.now(),
    title: req.body.title,
    buyerId: req.body.buyerId || 'user_2',
    sellerId: req.body.sellerId || 'user_1',
    amount: Number(req.body.amount),
    status: 'funded_in_escrow',
    createdAt: new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    escrowProtectionStartDate: new Date().toISOString().split('T')[0],
    escrowProtectionEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  };
  orders.unshift(newOrd);
  res.json(newOrd);
});

// User Management Endpoints
app.patch('/api/admin/users/:id', (req, res) => {
  const u = users.find(user => user.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  
  if (req.body.name !== undefined) u.name = req.body.name;
  if (req.body.email !== undefined) u.email = req.body.email;
  if (req.body.role !== undefined) u.role = req.body.role;
  if (req.body.title !== undefined) u.title = req.body.title;
  if (req.body.bio !== undefined) u.bio = req.body.bio;
  if (req.body.skills !== undefined) u.skills = Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
  if (req.body.hourlyRate !== undefined) u.hourlyRate = Number(req.body.hourlyRate);
  if (req.body.walletBalance !== undefined) u.walletBalance = Number(req.body.walletBalance);
  if (req.body.verified !== undefined) u.verified = Boolean(req.body.verified);
  if (req.body.status !== undefined) u.status = req.body.status;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'USER_PROFILE_EDITED',
    target: `User ${u.name}`,
    details: `Updated profile details and parameters for ${u.email}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(u);
});

app.patch('/api/admin/users/:id/status', (req, res) => {
  const u = users.find(user => user.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  
  const oldStatus = u.status;
  u.status = req.body.status;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: `USER_STATUS_${req.body.status.toUpperCase()}`,
    target: `User ${u.name}`,
    details: `Changed account status from ${oldStatus} to ${req.body.status}`,
    timestamp: new Date().toLocaleString()
  });

  // Notify user via chat message and email notification if suspended or restricted
  if (req.body.status === 'suspended' || req.body.status === 'restricted') {
    notifyUserOnAdminAction(u, req.body.status, req.body.notes);
  }

  res.json(u);
});

app.post('/api/admin/users/:id/impersonate', (req, res) => {
  const u = users.find(user => user.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'USER_IMPERSONATED',
    target: `User ${u.name}`,
    details: `Initialized administrative impersonation session for ${u.email}`,
    timestamp: new Date().toLocaleString()
  });

  // Send security chat notification & email
  notifyUserOnAdminAction(u, 'impersonated');

  res.json({ success: true, user: u });
});

app.patch('/api/admin/users/:id/verify', (req, res) => {
  const u = users.find(user => user.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  u.verified = !u.verified;

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: u.verified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
    target: `User ${u.name}`,
    details: `Verification status changed to ${u.verified}`,
    timestamp: new Date().toLocaleString()
  });

  res.json(u);
});

// Dispute Resolution Endpoint
app.patch('/api/admin/disputes/:id/resolve', (req, res) => {
  const d = disputes.find(disp => disp.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Dispute not found' });
  d.status = req.body.status;
  d.resolutionNotes = req.body.notes;
  auditLogs.unshift({
    id: 'log_' + Date.now(),
    actor: 'Admin Chief',
    role: 'super_admin',
    action: 'DISPUTE_RESOLVED',
    target: `Dispute #${d.id}`,
    details: `Resolved dispute with status ${req.body.status}. Notes: ${req.body.notes}`,
    timestamp: new Date().toLocaleString()
  });
  res.json(d);
});

// Support Ticket Reply Endpoint
app.post('/api/admin/tickets/:id/reply', (req, res) => {
  const t = supportTickets.find(tick => tick.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  t.messages.push({
    sender: 'WorkPerHour Support Staff',
    text: req.body.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  t.status = 'in_progress';
  res.json(t);
});

// Gemini AI Endpoints
app.post('/api/ai/proposal', async (req, res) => {
  try {
    const { projectTitle, projectDescription, freelancerTitle, freelancerSkills } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Write a professional, winning freelance proposal cover letter for a project titled "${projectTitle}".
Project Description: "${projectDescription}".
Freelancer Professional Title: "${freelancerTitle}".
Freelancer Skills: ${JSON.stringify(freelancerSkills)}.
Keep it engaging, professional, persuasive, concise (under 180 words), highlighting relevant expertise and a clear call to action.`,
    });
    res.json({ proposal: response.text || 'Failed to generate proposal.' });
  } catch (err: any) {
    console.error('AI Proposal Error:', err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

app.post('/api/ai/optimize-gig', async (req, res) => {
  try {
    const { title, description } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Optimize this freelance gig listing for better search visibility, conversion rate, and professionalism:
Title: "${title}"
Description: "${description}"

Return ONLY valid JSON with structure:
{
  "optimizedTitle": "...",
  "optimizedDescription": "...",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "pricingAdvice": "..."
}`,
      config: { responseMimeType: 'application/json' }
    });
    const json = JSON.parse(response.text || '{}');
    res.json(json);
  } catch (err: any) {
    console.error('AI Optimize Error:', err);
    res.status(500).json({ error: err.message || 'AI optimization failed' });
  }
});

// WebSocket Real-Time Chat Server
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'NEW_MESSAGE') {
        const newMsg: Message = {
          id: 'msg_' + Date.now(),
          orderId: parsed.orderId,
          senderId: parsed.senderId,
          senderName: parsed.senderName,
          text: parsed.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(newMsg);

        const payload = JSON.stringify({ type: 'MESSAGE_RECEIVED', message: newMsg });
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Vite middleware integration for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WorkPerHour server running on http://localhost:${PORT}`);
});
