
interface ClerkUser {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    username?: string | null;
    imageUrl: string;
    hasImage: boolean;
    primaryEmailAddressId?: string | null;
    primaryPhoneNumberId?: string | null;
    emailAddresses: ClerkEmailAddress[];
    phoneNumbers: ClerkPhoneNumber[];
    externalAccounts: ClerkExternalAccount[];
    organizationMemberships: ClerkOrganizationMembership[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface ClerkEmailAddress {
    id: string;
    emailAddress: string;
    verification: ClerkVerification;
  }
  
  interface ClerkPhoneNumber {
    id: string;
    phoneNumber: string;
    verification: ClerkVerification;
  }
  
  interface ClerkVerification {
    status: 'verified' | 'unverified' | 'failed' | 'expired';
    strategy: string;
    attempts?: number;
    expireAt?: Date;
  }
  
  interface ClerkExternalAccount {
    id: string;
    provider: string;
    identificationId: string;
    emailAddress: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    verification: ClerkVerification;
  }
  
  interface ClerkOrganizationMembership {
    id: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string;
    };
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface ClerkSession {
    id: string;
    status: 'active' | 'ended' | 'expired' | 'removed' | 'replaced' | 'revoked';
    expireAt: Date;
    abandonAt: Date;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
    user: ClerkUser;
  }
  
  interface ClerkOrganization {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    hasImage: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    membersCount: number;
    pendingInvitationsCount: number;
    adminDeleteEnabled: boolean;
  }
  
  // Tipos para los métodos de navegación
  interface ClerkNavigationProps {
    redirectUrl?: string;
    afterSignInUrl?: string;
    afterSignUpUrl?: string;
    routing?: 'hash' | 'path' | 'virtual';
  }
  
  // Interface principal de Clerk
  interface ClerkInstance {
    // Estado de carga
    loaded: boolean;
    
    // Usuario y sesión actuales
    user: ClerkUser | null;
    session: ClerkSession | null;
    organization: ClerkOrganization | null;
    
    // Métodos de navegación
    openUserProfile: (props?: ClerkNavigationProps) => void;
    closeUserProfile: () => void;
    openSignIn: (props?: ClerkNavigationProps) => void;
    closeSignIn: () => void;
    openSignUp: (props?: ClerkNavigationProps) => void;
    closeSignUp: () => void;
    openOrganizationProfile: (props?: ClerkNavigationProps) => void;
    closeOrganizationProfile: () => void;
    openCreateOrganization: (props?: ClerkNavigationProps) => void;
    closeCreateOrganization: () => void;
    
    // Métodos de autenticación
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
    
    // Métodos de gestión de sesión
    setActive: (params: {
      session?: ClerkSession | string | null;
      organization?: ClerkOrganization | string | null;
    }) => Promise<void>;
    
    // Event listeners
    addListener: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  }
  
  declare global {
    interface Window {
      Clerk: ClerkInstance;
    }
  }
  
  export {};