import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ShopMember, Shop } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  member: ShopMember | null;
  shop: Shop | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  member: null,
  shop: null,
  loading: true,
  signOut: async () => {},
  refreshMember: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<ShopMember | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMemberData(userId: string) {
    const { data: memberData } = await supabase
      .from('shop_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setMember(memberData as ShopMember | null);

    if (memberData) {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('id', memberData.shop_id)
        .maybeSingle();
      setShop(shopData as Shop | null);
    } else {
      setShop(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadMemberData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadMemberData(session.user.id);
          setLoading(false);
        })();
      } else {
        setMember(null);
        setShop(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setShop(null);
  };

  const refreshMember = async () => {
    if (user) {
      await loadMemberData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, member, shop, loading, signOut, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
