import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  profile: any;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const profileDoc = await getDoc(doc(db, 'users', authUser.uid));
        setProfile(profileDoc.exists() ? profileDoc.data() : null);
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      isAdmin: false,
      onboardingCompleted: false,
    });
    return userCredential.user;
  };

  const signOut = () => firebaseSignOut(auth);

  const updateProfile = async (data: any) => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), data);
      setProfile({ ...profile, ...data });
    }
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

