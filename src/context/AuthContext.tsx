import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

function createFallbackUser(authUser: SupabaseAuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || 'Student',
    college_name: authUser.user_metadata?.college_name || 'Unknown College',
    is_admin: false,
    is_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, collegeName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BLOCKED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
];

function isCollegeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return !BLOCKED_EMAIL_DOMAINS.includes(domain);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Track if we're in the middle of a sign in operation
  const signInInProgress = useRef(false);

  useEffect(() => {
    console.log('STEP 0: Auth context initializing');

    let mounted = true;

    // Initialize session
    const initAuth = async () => {
      try {
        console.log('STEP 1: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) {
          console.log('STEP 1a: Component unmounted, aborting');
          return;
        }

        if (error) {
          console.error('STEP 1b: Get session error:', error);
          setLoading(false);
          return;
        }

        console.log('STEP 2: Initial session:', session ? 'active' : 'none');
        setSession(session);

        if (session?.user) {
          console.log('STEP 3: Fetching user profile for initial session');
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (userError) {
            console.error('STEP 3a: User fetch error:', userError);
          } else {
            console.log('STEP 4: User profile loaded:', userData?.full_name);
            setUser(userData);
          }
        }

        console.log('STEP 5: Initial auth complete, setLoading(false)');
        setLoading(false);
      } catch (err) {
        console.error('STEP 1c: Init exception:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`STEP 6: Auth state changed: ${event}`);

        if (!mounted) {
          console.log('STEP 6a: Component unmounted');
          return;
        }

        // Skip events during manual sign in
        if (signInInProgress.current) {
          console.log('STEP 6b: Sign in in progress, skipping event');
          return;
        }

        // Update session
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.user) {
          console.log('STEP 7: SIGNED_IN event, fetching profile');
          setLoading(true);

          // Fetch with timeout
          const fetchPromise = supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 5000)
          );

          Promise.race([fetchPromise, timeoutPromise])
            .then(({ data: userData, error }) => {
              if (!mounted) return;

              if (error) {
                console.error('STEP 7a: Error fetching profile:', error.message);
                setUser(createFallbackUser(newSession.user));
              } else {
                console.log('STEP 8: Profile fetched:', userData?.full_name);
                setUser(userData);
              }
              setLoading(false);
            });
        } else if (event === 'SIGNED_OUT') {
          console.log('STEP 9: SIGNED_OUT event, clearing state');
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('STEP 10: Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, collegeName: string) => {
    console.log('STEP 0: Starting sign up for:', email);

    if (!isCollegeEmail(email)) {
      console.log('STEP 0a: Invalid email domain:', email);
      return { error: 'Please use a college or institutional email address. Public email providers (Gmail, Yahoo, Hotmail, Outlook, iCloud) are not allowed.' };
    }

    setLoading(true);

    try {
      console.log('STEP 1: Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            college_name: collegeName,
          },
        },
      });

      console.log('STEP 2: Sign up result, error:', error ? 'yes' : 'no');

      if (error) {
        console.error('STEP 2a: Sign up error:', error);
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        console.log('STEP 3: Waiting for profile creation...');
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Create profile manually (trigger should handle it, but be safe)
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            college_name: collegeName,
          })
          .select()
          .single();

        if (!profileError && userData) {
          console.log('STEP 4: Profile created:', userData.full_name);
          setUser(userData);
          setSession(data.session);
        }
      }

      console.log('STEP 5: Sign up complete, setLoading(false)');
      setLoading(false);
      return {};
    } catch (err) {
      console.error('STEP 6: Sign up exception:', err);
      setLoading(false);
      return { error: 'Network error. Please check your connection.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('STEP 1: Sign in started');
    console.log('Loading =', loading);

    setLoading(true);
    signInInProgress.current = true;
    console.log('STEP 2: setLoading(true), signInInProgress = true');

    try {
      console.log('STEP 3: Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      console.log('STEP 4: Supabase auth result, error:', error ? 'yes' : 'no');

      if (error) {
        console.error('STEP 4a: Sign in error:', error);
        setLoading(false);
        signInInProgress.current = false;
        return { error: error.message };
      }

      console.log('STEP 5: Supabase auth success, user id:', data.user?.id);
      console.log('STEP 6: Fetching user profile');

      // Update session immediately
      setSession(data.session);

      // Fetch user profile with timeout
      console.log('STEP 6a: Starting profile fetch...');
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timeout' } }), 5000)
      );

      const profileResult = await Promise.race([profilePromise, timeoutPromise]);
      const { data: userData, error: profileError } = profileResult;

      console.log('STEP 7: Profile fetch complete, error:', profileError ? 'yes' : 'no');

      if (profileError) {
        console.error('STEP 7a: Profile fetch error:', profileError?.message || profileError);
        // Bypass profile fetch - just use auth user data directly
        console.log('STEP 7b: Bypassing profile, using auth user data');
        setUser(createFallbackUser(data.user));
      } else {
        console.log('STEP 8: Profile fetched:', userData?.full_name);
        setUser(userData);
      }

      console.log('STEP 9: Updating React state, setLoading(false)');
      setLoading(false);
      signInInProgress.current = false;

      console.log('STEP 10: Sign in complete, returning');
      return {};
    } catch (err) {
      console.error('STEP 11: Sign in exception:', err);
      setLoading(false);
      signInInProgress.current = false;
      return { error: 'Network error. Please check your connection.' };
    }
  };

  const signOut = async () => {
    console.log('STEP 0: Signing out...');
    setLoading(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      setUser({ ...user, ...updates });
      return {};
    } catch (err) {
      console.error('[Auth] Update profile error:', err);
      return { error: 'Failed to update profile' };
    }
  };

  console.log('[Auth] Render, loading =', loading, ', user =', user?.full_name || 'none');

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
