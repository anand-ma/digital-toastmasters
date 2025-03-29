
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
}

const ADMIN_EMAIL = 'admin@admin.com'
const ADMIN_USER_ID = 'admin-user-id'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Check for admin login in localStorage
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
    
    if (isAdminLoggedIn) {
      // Create mock admin user and session
      const mockAdminUser = {
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        role: 'admin',
      } as User
      
      const mockAdminSession = {
        user: mockAdminUser,
        access_token: 'admin-access-token',
        refresh_token: 'admin-refresh-token',
      } as Session
      
      setUser(mockAdminUser)
      setSession(mockAdminSession)
      setLoading(false)
      return
    }
    
    // Regular Supabase auth flow for non-admin users
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string) {
    try {
      // Special handling for admin login
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        // Create mock admin user and session
        const mockAdminUser = {
          id: ADMIN_USER_ID,
          email: ADMIN_EMAIL,
          role: 'admin',
        } as User
        
        const mockAdminSession = {
          user: mockAdminUser,
          access_token: 'admin-access-token',
          refresh_token: 'admin-refresh-token',
        } as Session
        
        // Set admin login flag in localStorage
        localStorage.setItem('adminLoggedIn', 'true')
        
        // Update state
        setUser(mockAdminUser)
        setSession(mockAdminSession)
        
        toast({
          title: "Admin login successful",
          description: "You have been logged in as admin",
        })
        
        navigate('/dashboard')
        return Promise.resolve()
      }
      
      // Standard OTP flow for non-admin users
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: true,
        }
      })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "OTP code sent",
        description: "Check your email for the verification code",
      })
      
      return Promise.resolve()
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      // Admin is handled in signIn, but adding this check for safety
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return Promise.resolve()
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully"
      })
      
      navigate('/dashboard')
      return Promise.resolve()
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  async function signOut() {
    try {
      // Special handling for admin logout
      if (user?.email === ADMIN_EMAIL) {
        localStorage.removeItem('adminLoggedIn')
        setUser(null)
        setSession(null)
        toast({
          title: "Admin logged out",
          description: "You have been logged out successfully"
        })
        navigate('/')
        return
      }
      
      // Regular logout for other users
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      })
      navigate('/')
    } catch (error: any) {
      toast({
        title: "Error",
        description: "There was a problem signing out",
        variant: "destructive",
      })
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    verifyOtp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
