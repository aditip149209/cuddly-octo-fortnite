import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, googleProvider } from '../firebase/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.'
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'That email is already in use.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.'
    case 'auth/unauthorized-domain':
      return 'Google sign-in blocked: add this app domain (for local dev, localhost) in Firebase Authentication > Settings > Authorized domains.'
    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. We will redirect to Google sign-in instead.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled before completion.'
    default:
      return error.message || 'Authentication failed. Please try again.'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithEmail: async (email: string, password: string) => {
        try {
          await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
          throw new Error(toAuthErrorMessage(error))
        }
      },
      registerWithEmail: async (email: string, password: string) => {
        try {
          await createUserWithEmailAndPassword(auth, email, password)
        } catch (error) {
          throw new Error(toAuthErrorMessage(error))
        }
      },
      loginWithGoogle: async () => {
        try {
          await signInWithPopup(auth, googleProvider)
        } catch (error) {
          if (error instanceof FirebaseError && error.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider)
            return
          }
          throw new Error(toAuthErrorMessage(error))
        }
      },
      logout: async () => {
        await signOut(auth)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}