"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Edit3, 
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Search,
  UserMinus,
  UserCheck,
  ShieldAlert,
  Filter,
  RefreshCw,
  Trash2
} from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { validateRut, formatRut } from '@/lib/rut';

export default function SuperadminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userCompanyFilter, setUserCompanyFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>('');

  // Form State para Crear Empresa
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rut, setRut] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [businessLine, setBusinessLine] = useState('');
  const [code, setCode] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Encargado Inicial
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRut, setAdminRut] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin2026!');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edición Integral de Empresa
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLegalAddress, setEditLegalAddress] = useState('');
  const [editBusinessLine, setEditBusinessLine] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }

      setCurrentAdminId(authData.user.id);
      setCurrentAdminEmail(authData.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userRole = profile?.role || authData.user?.user_metadata?.role;
      const userEmail = profile?.email || authData.user?.email;

      if (userRole === 'superadmin' || userEmail === 'admin@diacero.com') {
        setIsSuperadmin(true);
      } else {
        router.push('/admin/dashboard');
        return;
      }

      const res = await fetch('/api/admin/superadmin/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Error cargando empresas superadmin:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/superadmin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error cargando usuarios superadmin:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'estudiante' | 'admin' | 'superadmin') => {
    setUpdatingUserId(userId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: newRole,
          actorId: currentAdminId,
          actorEmail: currentAdminEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al actualizar el rol.');
      } else {
        setSuccessMessage(`Rol de usuario actualizado exitosamente a "${newRole}".`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        fetchCompanies();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAssignCompany = async (userId: string, companyId: string) => {
    setUpdatingUserId(userId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyId,
          actorId: currentAdminId,
          actorEmail: currentAdminEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al vincular usuario con la empresa.');
      } else {
        const comp = companies.find(c => c.id === companyId);
        setSuccessMessage(`Usuario vinculado exitosamente a "${comp?.name || 'la empresa'}".`);
        setUsers(prev => prev.map(u => u.id === userId ? { 
          ...u, 
          company_id: companyId, 
          company_code: comp?.code,
          companies: comp || u.companies 
        } : u));
        fetchCompanies();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUnassignCompany = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas desvincular a este usuario de su empresa actual?')) return;
    setUpdatingUserId(userId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          unassignCompany: true,
          actorId: currentAdminId,
          actorEmail: currentAdminEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al desvincular usuario.');
      } else {
        setSuccessMessage('Usuario desvinculado exitosamente de la empresa.');
        setUsers(prev => prev.map(u => u.id === userId ? { 
          ...u, 
          company_id: null, 
          company_code: null,
          companies: null 
        } : u));
        fetchCompanies();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (code.length !== 6) {
      setErrorMessage('El código de empresa debe contener exactamente 6 caracteres alfanuméricos.');
      return;
    }

    if (!validateRut(rut)) {
      setErrorMessage('El RUT de la empresa es inválido.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          businessName,
          rut,
          legalAddress,
          businessLine,
          code: code.trim().toUpperCase(),
          logoUrl: logoUrl.trim() || null,
          adminName,
          adminEmail,
          adminRut,
          adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al crear la organización.');
        setIsSaving(false);
        return;
      }

      setSuccessMessage('¡Empresa y Encargado inicial registrados exitosamente!');
      setShowCreateModal(false);
      // Reset form
      setName('');
      setBusinessName('');
      setRut('');
      setLegalAddress('');
      setBusinessLine('');
      setCode('');
      setLogoUrl('');
      setAdminName('');
      setAdminEmail('');
      setAdminRut('');
      fetchCompanies();
    } catch (err: any) {
      setErrorMessage('Error al enviar la solicitud: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditCompany = (comp: any) => {
    setEditingCompany(comp);
    setEditName(comp.name || '');
    setEditBusinessName(comp.business_name || '');
    setEditRut(comp.rut || '');
    setEditCode(comp.code || '');
    setEditLegalAddress(comp.legal_address || '');
    setEditBusinessLine(comp.business_line || '');
    setEditLogoUrl(comp.logo_url || '');
    setEditIsActive(comp.is_active ?? true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    if (editCode.trim().length !== 6) {
      setErrorMessage('El código de empresa debe contener exactamente 6 caracteres alfanuméricos.');
      return;
    }

    if (!validateRut(editRut)) {
      setErrorMessage('El RUT de la empresa es inválido según el formato chileno (Módulo 11).');
      return;
    }

    setIsUpdatingCompany(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/superadmin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: editingCompany.id,
          name: editName.trim(),
          businessName: editBusinessName.trim(),
          rut: editRut.trim(),
          code: editCode.trim().toUpperCase(),
          legalAddress: editLegalAddress.trim(),
          businessLine: editBusinessLine.trim(),
          logoUrl: editLogoUrl.trim() || null,
          isActive: editIsActive,
          actorId: currentAdminId,
          actorEmail: currentAdminEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al actualizar la empresa.');
        return;
      }

      setSuccessMessage(`Empresa "${editName}" modificada exitosamente.`);
      setEditingCompany(null);
      fetchCompanies();
      fetchUsers();
    } catch (err: any) {
      setErrorMessage('Error al enviar cambios: ' + err.message);
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, hardDelete = false) => {
    const actionText = hardDelete 
      ? 'eliminar definitivamente a esta organización (sus usuarios quedarán desvinculados)' 
      : 'dar de baja (desactivar) a esta empresa';
    if (!confirm(`¿Estás seguro de que deseas ${actionText}?`)) return;

    setIsUpdatingCompany(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/superadmin/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          hardDelete,
          actorId: currentAdminId,
          actorEmail: currentAdminEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al eliminar la empresa.');
        return;
      }

      setSuccessMessage(data.message || 'Empresa procesada correctamente.');
      setEditingCompany(null);
      fetchCompanies();
      fetchUsers();
    } catch (err: any) {
      setErrorMessage('Error al procesar baja: ' + err.message);
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  // Filtrado memoizado de usuarios
  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    const nameStr = (u.name || u.full_name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const rutStr = (u.rut || '').toLowerCase();
    const compStr = (u.companies?.name || u.company_code || '').toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || emailStr.includes(q) || rutStr.includes(q) || compStr.includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesCompany = 
      userCompanyFilter === 'all' ? true :
      userCompanyFilter === 'unassigned' ? !u.company_id :
      u.company_id === userCompanyFilter;
    return matchesSearch && matchesRole && matchesCompany;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-brand-green/30 pb-12">
      {/* Header Compacto de Fila Única (Ultra responsivo en Móvil y PC) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link 
              href="/admin/dashboard"
              className="inline-flex items-center justify-center h-8 w-8 text-brand-blue hover:bg-brand-lightblue/20 border border-brand-blue/10 rounded-xl shadow-xs transition-colors shrink-0"
              title="Volver al Panel de Cursos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="scale-85 sm:scale-100 origin-left shrink-0">
              <Logo />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border border-purple-200">
              <ShieldCheck className="h-3 w-3 text-purple-700" />
              <span>Superadmin</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link href="/admin/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-brand-blue border-brand-blue/20 hover:bg-brand-lightblue/20 font-bold text-xs shadow-2xs rounded-xl flex items-center justify-center gap-1 h-8 px-2 sm:px-3"
                title="Panel de Cursos"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-brand-blue" />
                <span className="hidden sm:inline">Panel de Cursos</span>
              </Button>
            </Link>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs rounded-xl flex items-center gap-1 h-8 px-2.5 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Nueva Empresa</span>
              <span className="sm:hidden">Empresa</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        
        {/* Alerts */}
        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs font-bold p-3 sm:p-4 rounded-2xl border border-red-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 font-bold text-xs p-1">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 sm:p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs p-1">✕</button>
          </div>
        )}

        <Tabs defaultValue="companies" className="w-full space-y-4 sm:space-y-6">
          {/* Pestañas Segmentadas Fijas (Sticky) - Visibles SIEMPRE en Celular y PC */}
          <div className="sticky top-[49px] z-20 bg-[#F8FAFC]/95 backdrop-blur-md py-1.5 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <div className="w-full bg-slate-200/70 border border-slate-300/70 p-1 rounded-2xl shadow-xs">
              <TabsList className="grid grid-cols-2 w-full bg-transparent p-0 gap-1 h-auto">
                <TabsTrigger 
                  value="companies"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-xl font-bold text-xs sm:text-sm py-2 px-2 sm:px-4 transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 border border-transparent data-[state=active]:border-slate-200/80"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-purple-600" />
                  <span className="hidden sm:inline">Empresas y Organizaciones</span>
                  <span className="sm:hidden">Empresas</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                    {companies.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-xl font-bold text-xs sm:text-sm py-2 px-2 sm:px-4 transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 border border-transparent data-[state=active]:border-slate-200/80"
                >
                  <Users className="h-4 w-4 shrink-0 text-purple-600" />
                  <span className="hidden sm:inline">Usuarios y Roles</span>
                  <span className="sm:hidden">Usuarios</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
                    {users.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* TAB 1: EMPRESAS Y ORGANIZACIONES */}
          <TabsContent value="companies" className="space-y-4 sm:space-y-6">
            {/* Metric Cards - En móvil 3 columnas compactas en una sola fila */}
            <div className="grid grid-cols-3 gap-2 sm:gap-5">
              <Card className="rounded-xl sm:rounded-2xl border-brand-blue/10 shadow-2xs bg-white p-2.5 sm:p-4 text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Empresas</span>
                  <div className="hidden sm:flex p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-headline font-black text-brand-blue mt-0.5">{companies.length}</p>
                <span className="hidden sm:block text-[11px] text-slate-400 mt-0.5">Activas en plataforma</span>
              </Card>

              <Card className="rounded-xl sm:rounded-2xl border-brand-blue/10 shadow-2xs bg-white p-2.5 sm:p-4 text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Admins</span>
                  <div className="hidden sm:flex p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-headline font-black text-amber-700 mt-0.5">
                  {companies.reduce((sum, c) => sum + (c.totalAdmins || 0), 0)}
                </p>
                <span className="hidden sm:block text-[11px] text-slate-400 mt-0.5">Encargados autorizados</span>
              </Card>

              <Card className="rounded-xl sm:rounded-2xl border-brand-blue/10 shadow-2xs bg-white p-2.5 sm:p-4 text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos</span>
                  <div className="hidden sm:flex p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-headline font-black text-emerald-700 mt-0.5">
                  {companies.reduce((sum, c) => sum + (c.totalStudents || 0), 0)}
                </p>
                <span className="hidden sm:block text-[11px] text-slate-400 mt-0.5">Matriculados globalmente</span>
              </Card>
            </div>

            {/* Company List */}
            <Card className="rounded-2xl sm:rounded-3xl border-brand-blue/10 shadow-xs bg-white overflow-hidden">
              <CardHeader className="p-3.5 sm:p-6 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm sm:text-lg font-bold text-brand-blue flex items-center gap-2">
                      <Building2 className="h-4 sm:h-5 w-4 sm:w-5 text-purple-700 shrink-0" /> Nómina Integral de Empresas
                    </CardTitle>
                    <CardDescription className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Códigos de vinculación de 6 caracteres, representantes legales y logos corporativos.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="hidden sm:flex bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Registrar Empresa
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-700" /> Cargando directorio empresarial...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                    <p>No hay empresas registradas aún.</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      size="sm"
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Crear Primera Empresa
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* VISTA MÓVIL: Tarjetas Optimizadas */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {companies.map((comp) => (
                        <div key={comp.id} className="p-3.5 sm:p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3">
                              {comp.logo_url ? (
                                <img 
                                  src={comp.logo_url} 
                                  alt={comp.name} 
                                  className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-2xs" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                                  <Building2 className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono font-black text-[11px] tracking-wider">
                                    {comp.code}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    comp.is_active !== false 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}>
                                    {comp.is_active !== false ? '● Activa' : '○ Inactiva'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-brand-blue text-sm mt-0.5 leading-tight">{comp.name}</h4>
                                <p className="text-xs text-slate-500 font-medium">{comp.business_name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">RUT</span>
                              <span className="font-mono font-bold text-slate-800">{comp.rut}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estudiantes</span>
                              <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                                {comp.totalStudents || 0} alumnos
                              </span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-200/60">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Giro Comercial</span>
                              <span className="text-slate-700 text-[11px] truncate block">{comp.business_line}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Encargados (Admins):</span>
                            {comp.admins && comp.admins.length > 0 ? (
                              <div className="space-y-1">
                                {comp.admins.map((adm: any) => (
                                  <div key={adm.id} className="text-xs flex items-center justify-between bg-purple-50/40 px-2.5 py-1.5 rounded-lg border border-purple-100/70">
                                    <span className="font-bold text-slate-800">{adm.name}</span>
                                    <span className="text-[11px] text-purple-700 font-mono">{adm.email}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-red-500 font-bold text-[11px] bg-red-50 px-2 py-1 rounded-lg inline-block border border-red-100">
                                ⚠️ Sin encargado asignado
                              </span>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => handleOpenEditCompany(comp)}
                            className="w-full text-xs font-bold rounded-xl h-9 border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Modificar Organización
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* VISTA DESKTOP (PC): Tabla Estructurada */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="p-4 pl-6">Código / Logo</th>
                            <th className="p-4">Razón Social & RUT</th>
                            <th className="p-4">Giro & Dirección Legal</th>
                            <th className="p-4">Encargados (Admins)</th>
                            <th className="p-4">Estudiantes</th>
                            <th className="p-4 pr-6 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {companies.map((comp) => (
                            <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  {comp.logo_url ? (
                                    <img 
                                      src={comp.logo_url} 
                                      alt={comp.name} 
                                      className="w-9 h-9 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 shadow-2xs" 
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800 font-black text-[10px] font-mono shrink-0 shadow-2xs">
                                      {comp.code}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono font-black text-xs tracking-wider">
                                        {comp.code}
                                      </span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        comp.is_active !== false 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                          : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}>
                                        {comp.is_active !== false ? 'Activa' : 'Inactiva'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-brand-blue mt-0.5">{comp.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{comp.business_name}</p>
                                <p className="text-[11px] font-mono text-slate-500">{comp.rut}</p>
                              </td>
                              <td className="p-4 max-w-xs">
                                <p className="truncate text-slate-800 font-medium">{comp.business_line}</p>
                                <p className="text-[11px] text-slate-400 truncate">{comp.legal_address}</p>
                              </td>
                              <td className="p-4">
                                {comp.admins && comp.admins.length > 0 ? (
                                  <div className="space-y-1">
                                    {comp.admins.map((adm: any) => (
                                      <div key={adm.id} className="text-[11px]">
                                        <span className="font-bold text-slate-800">{adm.name}</span>
                                        <span className="text-slate-400 block text-[10px] font-mono">{adm.email}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-md border border-red-100 inline-block">
                                    Sin encargado
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-100">
                                  {comp.totalStudents || 0}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditCompany(comp)}
                                  className="text-[11px] font-bold rounded-lg h-8 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 flex items-center gap-1.5 ml-auto shadow-2xs"
                                >
                                  <Edit3 className="h-3.5 w-3.5" /> Modificar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: GESTIÓN DE USUARIOS, ASIGNACIONES Y ROLES */}
          <TabsContent value="users" className="space-y-6">
            {/* User Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-2xl border-brand-blue/10 shadow-xs bg-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
                  <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-headline font-black text-brand-blue mt-1">{users.length}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Perfiles registrados</p>
              </Card>

              <Card className="rounded-2xl border-brand-blue/10 shadow-xs bg-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Admins</span>
                  <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-headline font-black text-amber-700 mt-1">
                  {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Admins y Superadmins</p>
              </Card>

              <Card className="rounded-2xl border-brand-blue/10 shadow-xs bg-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Alumnos</span>
                  <div className="p-1.5 sm:p-2 bg-blue-50 text-brand-blue rounded-xl">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-headline font-black text-brand-blue mt-1">
                  {users.filter(u => u.role === 'estudiante').length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Estudiantes activos</p>
              </Card>

              <Card className="rounded-2xl border-brand-blue/10 shadow-xs bg-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Sin Empresa</span>
                  <div className="p-1.5 sm:p-2 bg-red-50 text-red-700 rounded-xl">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-headline font-black text-red-600 mt-1">
                  {users.filter(u => !u.company_id).length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Por vincular</p>
              </Card>
            </div>

            {/* Filter & Search Toolbar */}
            <Card className="rounded-2xl border-brand-blue/10 shadow-xs bg-white p-3.5 sm:p-4">
              <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Buscar por nombre, correo, RUT o empresa..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200 w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs font-medium h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/40 w-full"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="estudiante">Solo Estudiantes</option>
                    <option value="admin">Solo Admins de Empresa</option>
                    <option value="superadmin">Solo Superadmins</option>
                  </select>

                  <select
                    value={userCompanyFilter}
                    onChange={(e) => setUserCompanyFilter(e.target.value)}
                    className="text-xs font-medium h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/40 truncate w-full"
                  >
                    <option value="all">Todas las empresas</option>
                    <option value="unassigned">⚠️ Sin empresa asignada</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="h-10 text-xs rounded-xl border-slate-200 text-slate-600 hover:text-purple-700 flex items-center justify-center gap-1.5 w-full"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Users Roster */}
            <Card className="rounded-2xl sm:rounded-3xl border-brand-blue/10 shadow-xs bg-white overflow-hidden">
              <CardHeader className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-brand-blue flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-700 shrink-0" /> Padrón de Usuarios, Vinculación y Privilegios
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Asigna o desasigna colaboradores a empresas y modifica roles con efecto inmediato.
                  </CardDescription>
                </div>
                <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  {filteredUsers.length} de {users.length} usuarios
                </span>
              </CardHeader>

              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-700" /> Cargando nómina de colaboradores...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-medium">
                    No se encontraron usuarios con los filtros aplicados.
                  </div>
                ) : (
                  <>
                    {/* VISTA MÓVIL: Tarjetas Interactivas de Usuarios */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const isUpdating = updatingUserId === u.id;
                        return (
                          <div key={u.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-brand-blue text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                                  {(u.name || u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-brand-blue text-sm leading-tight">
                                    {u.name || u.full_name || 'Sin nombre registrado'}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">{u.email}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">RUT</span>
                                <span className="font-mono font-bold text-slate-800">
                                  {u.rut ? formatRut(u.rut) : 'Sin RUT'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Registro</span>
                                <span className="text-slate-600 font-medium">
                                  {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CL') : 'n/d'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">Rol del Usuario:</label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={u.role || 'estudiante'}
                                  disabled={isUpdating}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                                  className={`w-full text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 ${
                                    u.role === 'superadmin' 
                                      ? 'bg-purple-100 text-purple-900 border-purple-300' 
                                      : u.role === 'admin' 
                                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  <option value="estudiante">🎓 Estudiante</option>
                                  <option value="admin">🛡️ Admin de Empresa</option>
                                  <option value="superadmin">👑 Superadmin Global</option>
                                </select>
                                {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-purple-700 shrink-0" />}
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">Empresa Asignada:</label>
                              {u.company_id ? (
                                <div className="flex items-center justify-between gap-2 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono font-bold text-[11px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md shrink-0">
                                      {u.company_code || u.companies?.code}
                                    </span>
                                    <span className="font-bold text-slate-800 text-xs truncate">
                                      {u.companies?.name || 'Empresa vinculada'}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUnassignCompany(u.id)}
                                    disabled={isUpdating}
                                    title="Desvincular de esta empresa"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mb-1">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Sin empresa asignada
                                </span>
                              )}

                              <select
                                value=""
                                disabled={isUpdating}
                                onChange={(e) => {
                                  if (e.target.value) handleAssignCompany(u.id, e.target.value);
                                }}
                                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-slate-700 cursor-pointer"
                              >
                                <option value="">{u.company_id ? 'Reasignar a otra empresa...' : 'Vincular a empresa...'}</option>
                                {companies.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.code} - {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* VISTA DESKTOP (PC): Tabla Detallada */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="p-4 pl-6">Colaborador / Identidad</th>
                            <th className="p-4">RUT & Registro</th>
                            <th className="p-4">Rol del Usuario</th>
                            <th className="p-4">Empresa Asignada</th>
                            <th className="p-4 pr-6 text-right">Asignar / Cambiar Empresa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {filteredUsers.map((u) => {
                            const isUpdating = updatingUserId === u.id;
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-brand-blue text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                                      {(u.name || u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold text-brand-blue text-xs leading-tight">
                                        {u.name || u.full_name || 'Sin nombre registrado'}
                                      </p>
                                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono font-bold text-slate-700 block text-xs">
                                    {u.rut ? formatRut(u.rut) : 'Sin RUT'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CL') : 'Fecha n/d'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={u.role || 'estudiante'}
                                      disabled={isUpdating}
                                      onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 ${
                                        u.role === 'superadmin' 
                                          ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200' 
                                          : u.role === 'admin' 
                                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                      }`}
                                    >
                                      <option value="estudiante">🎓 Estudiante</option>
                                      <option value="admin">🛡️ Admin de Empresa</option>
                                      <option value="superadmin">👑 Superadmin Global</option>
                                    </select>
                                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-purple-700 shrink-0" />}
                                  </div>
                                </td>
                                <td className="p-4">
                                  {u.company_id ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                                        {u.company_code || u.companies?.code}
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs truncate max-w-[160px]">
                                        {u.companies?.name || 'Empresa vinculada'}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleUnassignCompany(u.id)}
                                        disabled={isUpdating}
                                        title="Desvincular de esta empresa"
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg ml-1"
                                      >
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                      <AlertCircle className="h-3 w-3" /> Sin empresa asignada
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <select
                                    value=""
                                    disabled={isUpdating}
                                    onChange={(e) => {
                                      if (e.target.value) handleAssignCompany(u.id, e.target.value);
                                    }}
                                    className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-slate-700 cursor-pointer max-w-[220px]"
                                  >
                                    <option value="">{u.company_id ? 'Reasignar a otra empresa...' : 'Vincular a empresa...'}</option>
                                    {companies.map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.code} - {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Registro de Empresa */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 my-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-brand-blue font-headline leading-tight">Registrar Empresa</h3>
                    <p className="text-xs text-slate-400">Crea la organización y su primer encargado de una vez.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCreateCompany} className="space-y-4">
                <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider">1. Datos Corporativos</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Nombre Fantasía *</Label>
                    <Input 
                      placeholder="Ej: Minera Cordillera" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Razón Social *</Label>
                    <Input 
                      placeholder="Ej: Minera Cordillera SpA" 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">RUT Empresa *</Label>
                    <Input 
                      placeholder="76.123.456-0" 
                      value={rut} 
                      onChange={(e) => setRut(formatRut(e.target.value))} 
                      required 
                      className="h-10 text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Código (6 Chars) *</Label>
                    <Input 
                      placeholder="MIN001" 
                      maxLength={6}
                      value={code} 
                      onChange={(e) => setCode(e.target.value.toUpperCase())} 
                      required 
                      className="h-10 text-xs font-mono font-bold uppercase text-center rounded-xl bg-purple-50/50 border-purple-200 text-purple-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">URL Logo (Opcional)</Label>
                    <Input 
                      placeholder="https://.../logo.png" 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Giro Comercial *</Label>
                    <Input 
                      placeholder="Ej: Extracción de Minerales y Faenas" 
                      value={businessLine} 
                      onChange={(e) => setBusinessLine(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Dirección Legal *</Label>
                    <Input 
                      placeholder="Ej: Av. del Cóndor 550, Santiago" 
                      value={legalAddress} 
                      onChange={(e) => setLegalAddress(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider pt-2 border-t border-slate-100">
                  2. Primer Encargado (Administrador de Empresa)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Nombre Encargado *</Label>
                    <Input 
                      placeholder="Ej: Laura Méndez" 
                      value={adminName} 
                      onChange={(e) => setAdminName(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">RUT Encargado</Label>
                    <Input 
                      placeholder="15.678.901-2" 
                      value={adminRut} 
                      onChange={(e) => setAdminRut(formatRut(e.target.value))} 
                      className="h-10 text-xs font-mono rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Correo Administrador *</Label>
                    <Input 
                      type="email"
                      placeholder="admin@empresa.cl" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Contraseña Inicial *</Label>
                    <Input 
                      type="text"
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto text-xs font-bold rounded-xl h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl h-10 shadow-sm"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Empresa y Encargado"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Modificación Integral de Empresa */}
        {editingCompany && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 my-auto animate-in fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-brand-blue font-headline leading-tight">
                      Modificar Empresa: {editingCompany.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Actualiza datos tributarios, código de 6 caracteres, dirección y logotipo.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingCompany(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Nombre Fantasía *</Label>
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Razón Social *</Label>
                    <Input 
                      value={editBusinessName} 
                      onChange={(e) => setEditBusinessName(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">RUT Empresa *</Label>
                    <Input 
                      value={editRut} 
                      onChange={(e) => setEditRut(formatRut(e.target.value))} 
                      required 
                      className="h-10 text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Código (6 Chars) *</Label>
                    <Input 
                      maxLength={6}
                      value={editCode} 
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())} 
                      required 
                      className="h-10 text-xs font-mono font-bold uppercase text-center bg-purple-50/50 border-purple-200 text-purple-900 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Estado Operativo</Label>
                    <select
                      value={editIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditIsActive(e.target.value === 'active')}
                      className="w-full h-10 text-xs font-bold px-3 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                    >
                      <option value="active">🟢 Activa</option>
                      <option value="inactive">🔴 Inactiva</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Giro Comercial *</Label>
                    <Input 
                      value={editBusinessLine} 
                      onChange={(e) => setEditBusinessLine(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-brand-blue uppercase">Dirección Legal *</Label>
                    <Input 
                      value={editLegalAddress} 
                      onChange={(e) => setEditLegalAddress(e.target.value)} 
                      required 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-brand-blue uppercase">URL o Ruta del Logo</Label>
                  <Input 
                    placeholder="https://.../logo.png" 
                    value={editLogoUrl} 
                    onChange={(e) => setEditLogoUrl(e.target.value)} 
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {editLogoUrl && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex items-center justify-center gap-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Vista Previa:</span>
                    <img src={editLogoUrl} alt="Preview" className="h-10 object-contain max-w-[120px]" />
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDeleteCompany(editingCompany.id, true)}
                    className="w-full sm:w-auto text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar Organización
                  </Button>
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingCompany(null)}
                      className="w-full sm:w-auto text-xs font-bold rounded-xl h-10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdatingCompany}
                      className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl h-10 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {isUpdatingCompany ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
