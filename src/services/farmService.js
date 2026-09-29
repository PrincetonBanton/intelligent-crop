import { supabase } from '../providers/supabaseProvider.js';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const farmService = {
  async getFarms() {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createFarm(farm, userId) {
    const { data, error } = await supabase
      .from('farms')
      .insert([{
        organization_id: DEFAULT_ORG_ID,
        created_by: userId,
        name: farm.name,
        location: farm.location,
        total_hectarage: parseFloat(farm.total_hectarage) || 0,
        primary_crop: farm.primary_crop
      }])
      .select();
    if (error) throw error;
    return data[0];
  }
};