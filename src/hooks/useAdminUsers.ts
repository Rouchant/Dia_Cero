"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function useAdminUsers() {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [dbModules, setDbModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const [isSuperadmin, setIsSuperadmin] = useState<boolean>(false);
  const [companyData, setCompanyData] = useState<any | null>(null);

  // User Creation State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("Cambiar123!");
  const [newUserRole, setNewUserRole] = useState<'estudiante' | 'admin'>('estudiante');
  const [newUserRut, setNewUserRut] = useState("");
  const [newUserHireDate, setNewUserHireDate] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Assignment State
  const [assignUserId, setAssignUserId] = useState("");
  const [assignModuleId, setAssignModuleId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Sistema de Alertas
  const [suppressionRequests, setSuppressionRequests] = useState<any[]>([]);
  const [stalledStudents, setStalledStudents] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push('/auth/login');
      return;
    }
    setCurrentAdminId(authData.user.id);

    // Obtener perfil del administrador para multi-tenancy
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', authData.user.id)
      .maybeSingle();

    const role = myProfile?.role || authData.user.user_metadata?.role || authData.user.app_metadata?.role;
    const userEmail = (myProfile?.email || authData.user.email || '').toLowerCase();
    const isSuperAdminUser = role === 'superadmin' || userEmail === 'admin@diacero.com' || userEmail.includes('superadmin');
    const isAdminUser = isSuperAdminUser || role === 'admin' || userEmail.includes('admin');

    if (!isAdminUser) {
      router.push('/dashboard');
      return;
    }

    const superAdminFlag = isSuperAdminUser;
    setIsSuperadmin(superAdminFlag);

    const adminCompanyId = myProfile?.company_id;
    if (myProfile?.companies) {
      setCompanyData(myProfile.companies);
    } else if (adminCompanyId) {
      const { data: comp } = await supabase.from('companies').select('*').eq('id', adminCompanyId).maybeSingle();
      if (comp) setCompanyData(comp);
    }

    let mData: any[] | null = null;
    let profiles: any[] | null = null;
    let progressData: any[] | null = null;

    try {
      const queryParams = new URLSearchParams();
      if (superAdminFlag) queryParams.set('isSuperadmin', 'true');
      if (adminCompanyId) queryParams.set('companyId', adminCompanyId);

      const res = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        profiles = json.users;
        progressData = json.progressData;
        mData = json.modules;
      }
    } catch (err) {
      console.warn("Error fetching /api/admin/users, falling back to direct client queries:", err);
    }

    if (!profiles || !progressData || !mData) {
      const [
        { data: mDataFallback },
        { data: profilesFallback },
        { data: progressFallback }
      ] = await Promise.all([
        supabase.from('modules').select('*, module_sections(*)'),
        superAdminFlag 
          ? supabase.from('profiles').select('*') 
          : (adminCompanyId 
              ? supabase.from('profiles').select('*').eq('company_id', adminCompanyId) 
              : supabase.from('profiles').select('*')),
        supabase.from('user_progress').select('*')
      ]);

      mData = mData || mDataFallback;
      profiles = profiles || profilesFallback;
      progressData = progressData || progressFallback;
    }

    if (mData) {
      setDbModules(mData);
      if (mData.length > 0) {
        setAssignModuleId(prev => prev || mData[0].id);
      }
    }

    if (profiles && mData) {
      const enhancedUsers = profiles.map(profile => {
        const userProgs = progressData?.filter(p => p.user_id === profile.id) || [];
        
        // Build module breakdown for Ficha del Alumno
        const moduleBreakdown = mData.map(mod => {
          const prog = userProgs.find(p => p.module_id === mod.id);
          const isAssigned = !!prog;
          const totalSections = Math.max(1, mod.module_sections?.length || 0);
          
          let completedSecs = 0;
          if (prog) {
            if (Array.isArray(prog.completed_sections)) {
              completedSecs = prog.completed_sections.length;
            } else if (prog.completed) {
              completedSecs = totalSections;
            }
          }

          const percent = isAssigned 
            ? Math.min(100, Math.round((completedSecs / totalSections) * 100))
            : 0;

          return {
            module_id: mod.id,
            title: mod.title,
            module_title: mod.title,
            is_assigned: isAssigned,
            completed_sections: completedSecs,
            total_sections: totalSections,
            progress_percentage: percent,
            last_active_at: prog?.last_active_at || prog?.updated_at || null
          };
        });

        const assignedModules = moduleBreakdown.filter(m => m.is_assigned);
        const overallPercent = assignedModules.length > 0
          ? Math.round(assignedModules.reduce((sum, m) => sum + m.progress_percentage, 0) / assignedModules.length)
          : (userProgs.length > 0 ? Math.round(moduleBreakdown.reduce((sum, m) => sum + m.progress_percentage, 0) / mData.length) : 0);

        return {
          ...profile,
          modules: moduleBreakdown,
          module_breakdown: moduleBreakdown,
          assignedCount: assignedModules.length,
          assigned_count: assignedModules.length,
          progress_percentage: overallPercent,
          completedCount: assignedModules.filter(m => m.progress_percentage === 100).length,
          last_active: profile.last_active || profile.created_at
        };
      });

      setUsers(enhancedUsers);

      // Detectar Alumnos Inactivos / Sin Avance
      const now = new Date();
      const stalled = enhancedUsers.filter(u => {
        if (u.role !== 'estudiante') return false;
        if (u.assignedCount === 0) return false;
        // Alerta 1: 0% de progreso teniendo cursos asignados
        if (u.progress_percentage === 0) return true;
        // Alerta 2: Sin actividad reciente hace más de 7 días
        if (u.last_active) {
          const lastActiveDate = new Date(u.last_active);
          const diffDays = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 7 && u.progress_percentage < 100) return true;
        }
        return false;
      });
      setStalledStudents(stalled);
    }

    // Cargar Solicitudes de Supresión para esta empresa
    try {
      const url = adminCompanyId 
        ? `/api/suppression-requests?companyId=${adminCompanyId}` 
        : '/api/suppression-requests';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuppressionRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error cargando tickets de supresión:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert("Por favor completa los campos obligatorios: Nombre, Correo y Contraseña.");
      return false;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
          rut: newUserRut.trim() || null,
          hireDate: newUserHireDate || null,
          companyId: companyData?.id || null,
          companyCode: companyData?.code || null
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al dar de alta usuario: " + (data.error || "Error de servidor"));
        return false;
      }

      alert("¡Usuario registrado exitosamente!");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRut("");
      setNewUserHireDate("");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al crear usuario: " + err.message);
      return false;
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return false;
    if (!confirm("¿Está seguro de que desea eliminar a este usuario de la plataforma? Esta acción es irreversible.")) {
      return false;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al eliminar usuario: " + (data.error || "Error de servidor"));
        return false;
      }

      alert("Usuario eliminado exitosamente.");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al eliminar usuario: " + err.message);
      return false;
    }
  };

  const handleChangeUserRole = async (targetUserId: string, newRole: 'admin' | 'estudiante') => {
    if (!targetUserId || !newRole) return false;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, newRole })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error actualizando rol: " + (data.error || "Error de servidor"));
        return false;
      }
      alert(`¡Rol del usuario actualizado a ${newRole === 'admin' ? 'Administrador' : 'Alumno'} con éxito!`);
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al cambiar rol: " + err.message);
      return false;
    }
  };

  const handleResetUserPassword = async (userId: string, newPass: string) => {
    if (!userId || !newPass || newPass.length < 6) {
      alert("La nueva contraseña debe contener al menos 6 caracteres.");
      return false;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al restablecer contraseña: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡Contraseña restablecida exitosamente!");
      return true;
    } catch (err: any) {
      alert("Error de red al actualizar contraseña: " + err.message);
      return false;
    }
  };

  const handleChangeUserHireDate = async (userId: string, newHireDate: string | null) => {
    if (!userId) return false;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hireDate: newHireDate || null })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error actualizando fecha de contratación: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡Fecha de contratación actualizada con éxito!");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de red al actualizar fecha de contratación: " + err.message);
      return false;
    }
  };

  const handleChangeUserRut = async (userId: string, newRut: string | null) => {
    if (!userId) return false;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rut: newRut || null })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error actualizando RUT: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡RUT de usuario actualizado con éxito!");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de red al actualizar RUT: " + err.message);
      return false;
    }
  };

  const handleChangeUserName = async (userId: string, newName: string) => {
    if (!userId || !newName.trim()) {
      alert("El nombre de usuario no puede estar vacío.");
      return false;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: newName.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error actualizando nombre: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡Nombre de usuario actualizado con éxito!");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de red al actualizar nombre: " + err.message);
      return false;
    }
  };

  const handleAssignModuleDirectly = async (userId: string, moduleId: string) => {
    if (!userId || !moduleId) return false;
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, moduleId })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error asignando módulo: " + (data.error || "Error de servidor"));
        return false;
      }
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al asignar módulo: " + err.message);
      return false;
    }
  };

  const handleUnassignModuleDirectly = async (userId: string, moduleId: string) => {
    if (!userId || !moduleId) return false;
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, moduleId })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error desasignando módulo: " + (data.error || "Error de servidor"));
        return false;
      }
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al desasignar módulo: " + err.message);
      return false;
    }
  };

  const handleAssignModule = async () => {
    if (!assignUserId || !assignModuleId) {
      alert("Seleccione un alumno y un módulo para asignar.");
      return;
    }
    setIsAssigning(true);
    const success = await handleAssignModuleDirectly(assignUserId, assignModuleId);
    setIsAssigning(false);
    if (success) {
      alert("¡Módulo asignado exitosamente!");
    }
  };

  const handleRenameModule = async (moduleId: string, newTitle: string, newDesc?: string) => {
    if (!moduleId || !newTitle.trim()) return false;
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, title: newTitle.trim(), description: newDesc })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error renombrando módulo: " + (data.error || "Error"));
        return false;
      }
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
      return false;
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!moduleId) return false;
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al eliminar módulo: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡Módulo eliminado correctamente!");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión al eliminar módulo: " + err.message);
      return false;
    }
  };

  const handleCreateModule = async (title: string, description: string) => {
    if (!title.trim()) return false;
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al crear módulo: " + (data.error || "Error"));
        return false;
      }
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error al crear módulo: " + err.message);
      return false;
    }
  };

  // Autogestión Corporativa: Actualizar datos de Mi Empresa
  const handleUpdateCompanyInfo = async (updates: {
    name?: string;
    businessName?: string;
    rut?: string;
    legalAddress?: string;
    businessLine?: string;
    logoUrl?: string;
  }) => {
    if (!companyData?.id) {
      alert("No se encontró una empresa asociada a su cuenta de administrador.");
      return false;
    }

    try {
      const res = await fetch('/api/admin/superadmin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyData.id,
          ...updates
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error actualizando información corporativa: " + (data.error || "Error de servidor"));
        return false;
      }
      alert("¡Información de la empresa actualizada correctamente!");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
      return false;
    }
  };

  // Resolución de Tickets de Supresión
  const handleResolveSuppressionTicket = async (ticketId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const res = await fetch('/api/suppression-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status,
          resolutionNotes: notes || null,
          adminId: currentAdminId
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error al procesar ticket: " + (data.error || "Error de servidor"));
        return false;
      }
      alert(data.message || "Ticket procesado exitosamente.");
      await fetchData();
      return true;
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
      return false;
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.rut?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const students = users.filter(u => u.role === 'estudiante');
  const totalStudents = students.length;
  const completedStudents = students.filter(u => u.progress_percentage === 100).length;
  const totalProgress = students.reduce((sum, u) => sum + (u.progress_percentage || 0), 0);
  const averageProgress = totalStudents > 0 ? Math.round(totalProgress / totalStudents) : 0;

  return {
    loading,
    searchQuery,
    setSearchQuery,
    users,
    filteredUsers,
    students,
    dbModules,
    currentAdminId,
    isSuperadmin,
    companyData,
    totalStudents,
    averageProgress,
    completedStudents,
    selectedUserStats,
    setSelectedUserStats,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    newUserRut,
    setNewUserRut,
    newUserHireDate,
    setNewUserHireDate,
    isCreatingUser,
    handleCreateUser,
    handleDeleteUser,
    handleChangeUserRole,
    assignUserId,
    setAssignUserId,
    assignModuleId,
    setAssignModuleId,
    isAssigning,
    handleAssignModule,
    handleAssignModuleDirectly,
    handleUnassignModuleDirectly,
    handleRenameModule,
    handleDeleteModule,
    handleResetUserPassword,
    handleChangeUserHireDate,
    handleChangeUserRut,
    handleChangeUserName,
    handleCreateModule,
    // Nuevas funcionalidades de Alertas y Autogestión
    suppressionRequests,
    stalledStudents,
    handleUpdateCompanyInfo,
    handleResolveSuppressionTicket
  };
}
