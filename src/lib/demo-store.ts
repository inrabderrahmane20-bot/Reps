export type UserRole = 'client' | 'professional' | 'admin';

export type DemoUser = {
  name: string;
  email: string;
  role: UserRole;
  city: string;
};

export type ServiceSubmission = {
  id: string;
  ownerEmail: string;
  name: string;
  category: string;
  title: string;
  description: string;
  serviceArea: string;
  priceRange: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type DemoState = {
  user: DemoUser | null;
  submissions: ServiceSubmission[];
  savedIds: string[];
  notificationRead: boolean;
};

export const demoStorageKey = 'medina-demo-state';

export const initialDemoState: DemoState = {
  user: null,
  submissions: [],
  savedIds: [],
  notificationRead: false,
};

export function readDemoState(): DemoState {
  if (typeof window === 'undefined') return initialDemoState;
  try {
    const stored = window.localStorage.getItem(demoStorageKey);
    return stored ? { ...initialDemoState, ...JSON.parse(stored) } : initialDemoState;
  } catch {
    return initialDemoState;
  }
}

export function writeDemoState(state: DemoState) {
  window.localStorage.setItem(demoStorageKey, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('medina-demo-state-change'));
}

export function createDemoId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}