import { supabase } from '../providers/supabaseProvider.js';

export const blockService = {
  async getBlocksByFarm(farmId) {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('farm_id', farmId)
      .order('block_code', { ascending: true });

    if (error) throw new Error(`[Database Error] ${error.message}`);
    return data || [];
  },

  async createBlock(blockData) {
    const { data, error } = await supabase
      .from('blocks')
      .insert([blockData])
      .select()
      .single();

    if (error) throw new Error(`[Insert Error] ${error.message}`);
    return data;
  },

  async deleteBlock(blockId) {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw new Error(`[Delete Error] ${error.message}`);
  }
};