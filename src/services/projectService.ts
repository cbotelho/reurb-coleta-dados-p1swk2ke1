import { supabase } from '@/lib/supabase/client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
}

export class ProjectService {
  static async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('id, name, description, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar projetos:', error);
        throw new Error(`Erro ao buscar projetos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro em getProjects:', error);
      throw error;
    }
  }

  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('id, name, description, status, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar projeto:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro em getProjectById:', error);
      return null;
    }
  }
}
