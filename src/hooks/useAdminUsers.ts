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

  // User Creation State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("Cambiar123!");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Assignment State
  const [assignUserId, setAssignUserId] = useState("");
  const [assignModuleId, setAssignModuleId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push('/auth/login');
      return;
    }
    const userRole = authData.user.user_metadata?.role;
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const { data: mData } = await supabase.from('modules').select('*, module_sections(*)');
    if (mData) {
      setDbModules(mData);
      if (mData.length > 0) {
        setAssignModuleId(prev => prev || mData[0].id);
      }
    }

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: progressData } = await supabase.from('user_progress').select('*');

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
            is_assigned: isAssigned,
            completed_sections: completedSecs,
            total_sections: totalSections,
            progress_percentage: percent
          };
        });

        const assignedModules = moduleBreakdown.filter(m => m.is_assigned);
        const overallPercent = assignedModules.length > 0
          ? Math.round(assignedModules.reduce((sum, m) => sum + m.progress_percentage, 0) / assignedModules.length)
          : (userProgs.length > 0 ? Math.round(moduleBreakdown.reduce((sum, m) => sum + m.progress_percentage, 0) / mData.length) : 0);

        return {
          ...profile,
          progress_percentage: overallPercent,
          module_breakdown: moduleBreakdown,
          assigned_count: assignedModules.length
        };
      });

      setUsers(enhancedUsers);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falla creando perfil de alumno');
      }

      alert("¡Usuario alumno creado exitosamente!");
      setNewUserName("");
      setNewUserEmail("");
      fetchData();
    } catch (err: any) {
      alert("Error en la operación: " + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleAssignModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignModuleId) return;

    setIsAssigning(true);
    // Check if progress row already exists
    const { data: existing } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', assignUserId)
      .eq('module_id', assignModuleId)
      .maybeSingle();

    if (existing) {
      alert("Aviso: El estudiante seleccionado ya tiene asignado este módulo.");
      setIsAssigning(false);
      return;
    }

    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: assignUserId,
        module_id: assignModuleId,
        completed_sections: []
      });

    if (error) {
      alert("Falla al asignar el módulo: " + error.message);
    } else {
      alert("¡Módulo inyectado exitosamente al alumno!");
      fetchData();
    }
    setIsAssigning(false);
  };

  const handleRenameModule = async (moduleId: string, newTitle: string) => {
    if (!moduleId || !newTitle.trim()) return;
    const { error } = await supabase
      .from('modules')
      .update({ title: newTitle.trim() })
      .eq('id', moduleId);

    if (error) {
      alert("Error renombrando el módulo: " + error.message);
    } else {
      setDbModules(prev => prev.map(m => m.id === moduleId ? { ...m, title: newTitle.trim() } : m));
      fetchData();
    }
  };

  const handleResetUserPassword = async (targetUserId: string, newPass: string) => {
    if (!targetUserId || !newPass || newPass.length < 6) {
      alert("La nueva contraseña debe contener al menos 6 caracteres.");
      return false;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error restableciendo contraseña: " + (data.error || "Error de servidor"));
        return false;
      } else {
        alert("¡Contraseña del estudiante restablecida con éxito!");
        return true;
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
      return false;
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show all registered users in students list so no registered student is ever excluded
  const students = users;
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
    isCreatingUser,
    handleCreateUser,
    assignUserId,
    setAssignUserId,
    assignModuleId,
    setAssignModuleId,
    isAssigning,
    handleAssignModule,
    handleRenameModule,
    handleResetUserPassword
  };
}
