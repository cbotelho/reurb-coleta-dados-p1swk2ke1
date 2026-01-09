import { useCallback, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsePermissionsReturn {
  hasPermission: (permission: string) => Promise<boolean>;
  hasAnyPermission: (permissions: string[]) => Promise<boolean>;
  hasAllPermissions: (permissions: string[]) => Promise<boolean>;
  isAdmin: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { hasPermission: checkPermission, user } = useAuth();

  const isAdmin = user?.grupo_acesso === 'Administrador' || user?.grupo_acesso === 'Administradores' || false;

  const hasPermission = useCallback(
    async (permission: string): Promise<boolean> => {
      try {
        // Se não houver usuário, não tem permissão
        if (!user) return false;
        
        // Se for admin, tem todas as permissões
        if (isAdmin) return true;
        
        // Verifica a permissão
        return await checkPermission(permission);
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
      }
    },
    [checkPermission, user, isAdmin]
  );

  const hasAnyPermission = useCallback(
    async (permissions: string[]): Promise<boolean> => {
      try {
        // Se não houver usuário, não tem permissão
        if (!user) return false;
        
        // Se for admin, tem todas as permissões
        if (isAdmin) return true;
        
        // Verifica se tem alguma das permissões
        for (const permission of permissions) {
          if (await checkPermission(permission)) {
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
      }
    },
    [checkPermission, user, isAdmin]
  );

  const hasAllPermissions = useCallback(
    async (permissions: string[]): Promise<boolean> => {
      try {
        // Se não houver usuário, não tem permissão
        if (!user) return false;
        
        // Se for admin, tem todas as permissões
        if (isAdmin) return true;
        
        // Verifica se tem todas as permissões
        for (const permission of permissions) {
          if (!(await checkPermission(permission))) {
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
      }
    },
    [checkPermission, user, isAdmin]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
}
