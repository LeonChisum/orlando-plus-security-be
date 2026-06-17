import { supabase } from './supabase'

export const getSession = () => supabase.auth.getSession()

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()
