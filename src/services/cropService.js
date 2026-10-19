import { supabase } from '../providers/supabaseProvider.js';

export const cropService = {
  async getCropTemplates() {
    const { data, error } = await supabase
      .from('crop_templates')
      .select('*')
      .order('crop_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createCropTemplate(templateData) {
    const { data, error } = await supabase
      .from('crop_templates')
      .insert([templateData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCropTemplate(id) {
    const { error } = await supabase
      .from('crop_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // --- Phenological Stages Methods ---
  async getStagesByTemplate(templateId) {
    const { data, error } = await supabase
      .from('crop_stages')
      .select('*')
      .eq('template_id', templateId)
      .order('dafi_start', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createStage(stageData) {
    const { data, error } = await supabase
      .from('crop_stages')
      .insert([stageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStage(stageId) {
    const { error } = await supabase
      .from('crop_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
    return true;
  }
};