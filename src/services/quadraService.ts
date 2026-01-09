import { supabase } from '@/lib/supabase/client';

export interface Quadra {
  id: string;
  name: string;
  project_id: string;
  area?: string;
  document_url?: string;
  image_url?: string;
  status?: string;
  created_at: string;
}

export class QuadraService {
  static async getQuadrasByProject(projectId: string): Promise<Quadra[]> {
    try {
      const { data, error } = await supabase
        .from('reurb_quadras')
        .select('id, name, project_id, area, document_url, image_url, status, created_at')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar quadras:', error);
        throw new Error(`Erro ao buscar quadras: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro em getQuadrasByProject:', error);
      throw error;
    }
  }

  static async getQuadraById(id: string): Promise<Quadra | null> {
    try {
      const { data, error } = await supabase
        .from('reurb_quadras')
        .select('id, name, project_id, area, document_url, image_url, status, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar quadra:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro em getQuadraById:', error);
      return null;
    }
  }
}
