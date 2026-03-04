export interface Domain {
  id: string;
  name: string;
  status?: 'pending' | 'verified' | 'failed';
  verificationToken?: string;
  verificationType?: 'txt';
}

export interface HistoryItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  timestamp: number;
  expiresAt?: string | null;
  isBulk?: boolean;
  bulkUrls?: string[];
  clicks?: number;
}

export interface User {
  id: string;
  email: string | null;
  role?: string;
  plan?: string;
  pendingPlan?: string | null;
  status?: string;
  expiresAt?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  message?: string | null;
  usage?: {
    linksThisMonth: number;
    domains: number;
  };
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | null;
  createdAt: string;
  userId: string;
}

export interface LandingFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  displayOrder: number;
}

export interface LandingFaq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface PublicSettings {
  settings: Record<string, string>;
  features: LandingFeature[];
  faqs: LandingFaq[];
}
