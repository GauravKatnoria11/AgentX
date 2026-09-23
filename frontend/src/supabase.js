import { createClient } from '@supabase/supabase-js';
import { oauthCallback, setAuthToken } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sample-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_CALLBACK_URL = 'https://zvfysitimzyvwrnjwtbx.supabase.co/auth/v1/callback';

export const isLiveSupabase = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('sample-project') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isLiveSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Sign In with Google OAuth via Supabase
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const redirectOrigin = window.location.origin.replace(/\/+$/, '');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectOrigin
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Sign In with Facebook OAuth via Supabase
 */
export const signInWithFacebook = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const redirectOrigin = window.location.origin.replace(/\/+$/, '');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectOrigin
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with Email & Password via Supabase Auth
 */
export const signInWithEmail = async (email, password) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

/**
 * Sign up with Email & Password via Supabase Auth
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Listen for OAuth redirect tokens returned in URL hash (from Supabase redirect)
 */
export const initOAuthRedirectListener = async (onUserLoaded) => {
  if (isLiveSupabase && supabase) {
    const processSession = async (session) => {
      if (!session?.user) return;
      const u = session.user;
      const provider = u.app_metadata?.provider || 'google';

      const fallbackUser = {
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
        role: 'patient',
        avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture,
        created_at: u.created_at
      };

      try {
        const res = await oauthCallback({
          provider: provider === 'facebook' ? 'facebook' : 'google',
          access_token: session.access_token,
          email: u.email,
          full_name: fallbackUser.full_name,
          avatar_url: fallbackUser.avatar_url
        });
        if (res.success && res.data?.user && onUserLoaded) {
          onUserLoaded(res.data.user);
          return;
        }
      } catch (err) {
        console.warn('Backend sync delayed, using authenticated session user:', err);
      }

      // Graceful fallback: set authenticated Supabase user immediately
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      if (session.access_token) {
        setAuthToken(session.access_token);
      }
      if (onUserLoaded) {
        onUserLoaded(fallbackUser);
      }
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await processSession(session);
      }
    } catch (e) {
      console.warn('OAuth session check error:', e);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await processSession(session);
      }
    });
  }
};

/**
 * ========================================================
 * SUPABASE APPOINTMENTS CRUD OPERATIONS
 * ========================================================
 */
export const supabaseAppointments = {
  /**
   * Create an appointment directly in Supabase
   */
  async create(data) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const appointmentRow = {
      id: data.id || crypto.randomUUID(),
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      hospital_id: data.hospital_id,
      department_id: data.department_id || null,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      status: data.status || 'confirmed',
      reason: data.reason || null,
      queue_number: data.queue_number || null,
      notes: data.notes || null,
      patient_phone: data.patient_phone || null,
      blood_group: data.blood_group || null,
      cancellation_reason: data.cancellation_reason || null
    };

    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert(appointmentRow)
      .select()
      .single();

    if (error) throw error;
    return inserted;
  },

  /**
   * Get an appointment by ID
   */
  async getById(id) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctors(name, specialization), hospitals(name, address)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all appointments for a patient
   */
  async getByPatient(patientId) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctors(name, specialization), hospitals(name, address)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Update an appointment by ID
   */
  async update(id, updates) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancel an appointment
   */
  async cancel(id, cancellationReason = 'Cancelled by user') {
    return this.update(id, {
      status: 'cancelled',
      cancellation_reason: cancellationReason
    });
  },

  /**
   * Mark appointment as completed
   */
  async complete(id) {
    return this.update(id, {
      status: 'completed'
    });
  },

  /**
   * Delete an appointment by ID
   */
  async delete(id) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

/**
 * ========================================================
 * SUPABASE MEDICAL RECORDS CRUD OPERATIONS
 * ========================================================
 */
export const supabaseMedicalRecords = {
  /**
   * Create a medical record directly in Supabase
   */
  async create(data) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const meta = {
      ...(data.metadata || {}),
      disease_category: data.disease_category || 'General Medicine',
      appointment_id: data.appointment_id || null,
      medicines: data.medicines || [],
      diet_plan: data.diet_plan || null
    };

    const row = {
      id: data.id || crypto.randomUUID(),
      patient_id: data.patient_id,
      doctor_id: data.doctor_id || null,
      hospital_id: data.hospital_id || null,
      title: data.title || 'Medical Record',
      record_type: data.record_type || 'General Record',
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      file_size_bytes: data.file_size_bytes || null,
      notes: data.notes || null,
      metadata: meta
    };

    const { data: inserted, error } = await supabase
      .from('medical_records')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return {
      ...inserted,
      disease_category: inserted.metadata?.disease_category || 'General Medicine',
      medicines: inserted.metadata?.medicines || [],
      diet_plan: inserted.metadata?.diet_plan || null,
      appointment_id: inserted.metadata?.appointment_id || null
    };
  },

  /**
   * Get a medical record by ID
   */
  async getById(id) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase
      .from('medical_records')
      .select('*, doctors(name, specialization), hospitals(name, address)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      disease_category: data.metadata?.disease_category || 'General Medicine',
      medicines: data.metadata?.medicines || [],
      diet_plan: data.metadata?.diet_plan || null,
      appointment_id: data.metadata?.appointment_id || null
    };
  },

  /**
   * Get all medical records for a patient
   */
  async getByPatient(patientId) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase
      .from('medical_records')
      .select('*, doctors(name, specialization), hospitals(name, address)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      disease_category: r.metadata?.disease_category || 'General Medicine',
      medicines: r.metadata?.medicines || [],
      diet_plan: r.metadata?.diet_plan || null,
      appointment_id: r.metadata?.appointment_id || null
    }));
  },

  /**
   * Update a medical record by ID
   */
  async update(id, updates) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    
    const existing = await this.getById(id);
    const meta = {
      ...(existing?.metadata || {}),
      ...(updates.metadata || {})
    };
    if (updates.disease_category) meta.disease_category = updates.disease_category;
    if (updates.medicines) meta.medicines = updates.medicines;
    if (updates.diet_plan) meta.diet_plan = updates.diet_plan;
    if (updates.appointment_id) meta.appointment_id = updates.appointment_id;

    const rowUpdates = {
      ...updates,
      metadata: meta,
      updated_at: new Date().toISOString()
    };
    delete rowUpdates.disease_category;
    delete rowUpdates.medicines;
    delete rowUpdates.diet_plan;
    delete rowUpdates.appointment_id;

    const { data, error } = await supabase
      .from('medical_records')
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      disease_category: data.metadata?.disease_category || 'General Medicine',
      medicines: data.metadata?.medicines || [],
      diet_plan: data.metadata?.diet_plan || null,
      appointment_id: data.metadata?.appointment_id || null
    };
  },

  /**
   * Delete a medical record by ID
   */
  async delete(id) {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

