import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: 'admin' | 'tecnico' | 'gestor' | 'cidadão';
  showForbidden?: boolean;
  redirectTo?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredRole,
  showForbidden = true,
  redirectTo,
}) => {
  const { user, hasPermission, isAuthenticated, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !user) {
        setHasAccess(false);
        return;
      }
 
      // Verifica se tem a role necessária
      if (requiredRole && user.role !== requiredRole) {
        setHasAccess(false);
        if (redirectTo) {
          navigate(redirectTo);
          toast.error('Você não tem permissão para acessar esta página.');
        }
        return;
      }

      // Se não há permissão específica requerida, permite o acesso
      if (!requiredPermission) {
        setHasAccess(true);
        return;
      }

      // Verifica a permissão específica
      try {
        const hasPerm = await hasPermission(requiredPermission);
        setHasAccess(hasPerm);
        
        if (!hasPerm && redirectTo) {
          navigate(redirectTo);
          toast.error('Você não tem permissão para acessar esta página.');
        }
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [user, isAuthenticated, requiredPermission, requiredRole, hasPermission, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess === false) {
    return showForbidden ? (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
          <p className="mt-2 text-muted-foreground">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      </div>
    ) : null;
  }

  return <>{children}</>;
};

export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PermissionGuardProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PermissionGuard {...options}>
      <Component {...props} />
    </PermissionGuard>
  );
  return WrappedComponent;
};
