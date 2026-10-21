import { supabase } from '../providers/supabaseProvider.js';

export const farmService = {
  // Diagnostic method to verify Supabase connection & schema accessibility
  async diagnoseConnection() {
    try {
      const { data, error } = await supabase.from('farms').select('count', { count: 'exact', head: true });
      if (error) {
        return { ok: false, message: `Schema error: ${error.message} (Code: ${error.code})` };
      }
      return { ok: true, message: 'Successfully connected to public.farms table.' };
    } catch (err) {
      return { ok: false, message: `Network/Connection failure: ${err.message}` };
    }
  },

  // Fetch all registered farms
  async getFarms() {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[farmService.getFarms Error]:', error);
      throw new Error(`[Database Error] ${error.message} (Code: ${error.code})`);
    }
    return data || [];
  },

  // Create a new farm entity (e.g., B1 - Baracatan)
  async createFarm(farmData, userParam = null) {
    const payload = {
      name: farmData.name,
      location: farmData.location,
      total_hectarage: parseFloat(farmData.total_hectarage) || 0.00,
      primary_crop: farmData.primary_crop || null
    };

    // Safely resolve whether userParam is an object or a direct UUID string
    let resolvedUserId = null;
    if (typeof userParam === 'string') {
      resolvedUserId = userParam;
    } else if (userParam && typeof userParam === 'object') {
      resolvedUserId = userParam.id || null;
    }

    if (resolvedUserId) {
      payload.created_by = resolvedUserId;
    }

    const { data, error } = await supabase
      .from('farms')
      .insert([payload])
      .select();

    if (error) {
      console.error('[farmService.createFarm Error]:', error);
      throw new Error(`[Insert Error] ${error.message} (Code: ${error.code})`);
    }

    return data[0];
  },

  // Update an existing farm entity
  async updateFarm(farmId, farmData) {
    const payload = {
      name: farmData.name,
      location: farmData.location,
      total_hectarage: parseFloat(farmData.total_hectarage) || 0.00,
      primary_crop: farmData.primary_crop || null
    };

    const { data, error } = await supabase
      .from('farms')
      .update(payload)
      .eq('id', farmId)
      .select();

    if (error) {
      console.error('[farmService.updateFarm Error]:', error);
      throw new Error(`[Update Error] ${error.message} (Code: ${error.code})`);
    }

    return data[0];
  },

  // Delete a farm entity
  async deleteFarm(farmId) {
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId);

    if (error) {
      console.error('[farmService.deleteFarm Error]:', error);
      throw new Error(`[Delete Error] ${error.message}`);
    }
  }
};