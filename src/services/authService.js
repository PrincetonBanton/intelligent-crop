import { supabase } from '../providers/supabaseProvider.js';

export const authService = {
  /**
   * Sign up a new user with optional role metadata
   */
  async signUp(email, password, role = 'owner', fullName = '') {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { 
        data: { role, full_name: fullName } 
      }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Log in existing user
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * Log out current session
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get active session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get currently logged-in user profile and role metadata
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'owner', // Defaults to owner if metadata is missing
      full_name: user.user_metadata?.full_name || user.email.split('@')[0]
    };
  },

  /**
   * Listen to session changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};