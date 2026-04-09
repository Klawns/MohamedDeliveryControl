export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  taxId?: string;
  cellphone?: string;
  hasSeenTutorial: boolean;
  subscription?: {
    plan: 'starter' | 'premium' | 'lifetime';
    status: 'active' | 'inactive' | 'canceled' | 'trial' | 'expired' | 'invalid';
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
    trialDaysRemaining?: number;
    isTrialExpiringSoon?: boolean;
    validUntil: string | null;
    rideCount?: number;
  } | null;
}
