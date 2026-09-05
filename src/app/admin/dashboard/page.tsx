"use client";

export const dynamic = 'force-dynamic';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Book, Users, UserCheck, Bell, Building2, ShieldCheck, Globe } from "lucide-react";
import Link from 'next/link';
import { Logo } from "@/components/ui/logo";

import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useTheoryContentBuilder } from '@/hooks/useTheoryContentBuilder';
import { useQuizManager } from '@/hooks/useQuizManager';

import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { UserManagementTab } from '@/components/admin/UserManagementTab';
import { UserAccountControlTab } from '@/components/admin/UserAccountControlTab';
import { TheoryContentBuilderTab } from '@/components/admin/TheoryContentBuilderTab';
import { AdminAlertsTab } from '@/components/admin/AdminAlertsTab';
import { CompanyManagementTab } from '@/components/admin/CompanyManagementTab';

export default function AdminDashboard() {
  // 1. Users & General Admin Hook (Multi-tenant & Alertas)
  const adminUsers = useAdminUsers();

  // 2. Theory Content Builder Hook
  const theoryBuilder = useTheoryContentBuilder(adminUsers.dbModules);

  // 3. Quiz Manager Hook (Synchronized with selected theory module)
  const quizManager = useQuizManager(adminUsers.dbModules, theoryBuilder.editContentModuleId);

  const pendingSuppressionCount = adminUsers.suppressionRequests.filter(r => r.status === 'pending').length;
  const stalledCount = adminUsers.stalledStudents.length;
  const totalAlertsCount = pendingSuppressionCount + stalledCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Admin Header */}
      <header className="bg-white/95 backdrop-blur-md text-brand-blue px-4 sm:px-6 py-2.5 shadow-xs border-b border-brand-blue/10 sticky top-0 z-20 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full h-10">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              aria-label="Volver al panel de estudiantes"
              className="inline-flex items-center justify-center h-8.5 w-8.5 text-brand-blue hover:bg-brand-lightblue/20 border border-brand-blue/10 rounded-xl shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver al panel de estudiantes</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center shrink-0 -translate-y-0.5">
                <Logo className="h-8 w-auto object-contain" />
              </div>
              <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0 mx-0.5" />
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-black uppercase tracking-wider inline-flex items-center leading-none shadow-2xs">
                  Panel de Administración
                </span>
                {adminUsers.companyData && (
                  <span className="h-7 px-2.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 hidden md:inline-flex items-center gap-1.5 leading-none shadow-2xs">
                    <Building2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                    <span>{adminUsers.companyData.name} ({adminUsers.companyData.code})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {adminUsers.isSuperadmin && (
              <Link href="/admin/superadmin" className="shrink-0">
                <Button 
                  size="sm"
                  className="h-8.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 px-3"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Consola Superadmin</span>
                </Button>
              </Link>
            )}
            <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />
            <div className="text-right hidden sm:flex flex-col justify-center shrink-0 leading-tight">
              <p className="text-xs font-bold text-slate-800 leading-tight">Encargado de Capacitación</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">Seguridad Día Cero</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {adminUsers.loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-brand-blue/10 shadow-sm animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-white rounded-3xl border border-brand-blue/10 shadow-sm animate-pulse flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
                Cargando nómina académica y alertas corporativas...
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Metric Cards Component */}
            <AdminStatsCards 
              totalStudents={adminUsers.totalStudents}
              totalUsers={adminUsers.users.length}
              averageProgress={adminUsers.averageProgress}
              completedStudents={adminUsers.completedStudents}
            />

        {/* Tabbed Navigation */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1.5 border border-slate-200 shadow-sm rounded-2xl flex flex-col sm:flex-row flex-wrap h-auto gap-1.5 w-full sm:w-auto">
            <TabsTrigger value="users" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <Users className="h-4 w-4" />
              Nómina & Progreso
            </TabsTrigger>
            
            <TabsTrigger value="alerts" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2 relative">
              <Bell className="h-4 w-4" />
              Alertas & Supresión
              {totalAlertsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] animate-pulse">
                  {totalAlertsCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="company" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-purple-700 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Mi Empresa
            </TabsTrigger>

            <TabsTrigger value="control" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <UserCheck className="h-4 w-4" />
              Control & Asignaciones
            </TabsTrigger>

            <TabsTrigger value="content" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <Book className="h-4 w-4" />
              Constructor & Quizzes
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Pure Academic Progress Monitoring */}
          <TabsContent value="users">
            <UserManagementTab
              filteredUsers={adminUsers.filteredUsers}
              searchQuery={adminUsers.searchQuery}
              setSearchQuery={adminUsers.setSearchQuery}
              onSelectUser={adminUsers.setSelectedUserStats}
              selectedUserStats={adminUsers.selectedUserStats}
              setSelectedUserStats={adminUsers.setSelectedUserStats}
              onAssignModuleDirectly={async (userId, modId) => { await adminUsers.handleAssignModuleDirectly(userId, modId); }}
              onUnassignModuleDirectly={async (userId, modId) => { await adminUsers.handleUnassignModuleDirectly(userId, modId); }}
              onChangeUserName={adminUsers.handleChangeUserName}
              isAssigning={adminUsers.isAssigning}
            />
          </TabsContent>

          {/* TAB 2: Alertas de Supresión (Ley 21.719) y Alumnos Inactivos */}
          <TabsContent value="alerts">
            <AdminAlertsTab
              suppressionRequests={adminUsers.suppressionRequests}
              stalledStudents={adminUsers.stalledStudents}
              onResolveTicket={adminUsers.handleResolveSuppressionTicket}
              onSelectUser={(user) => adminUsers.setSelectedUserStats(user)}
            />
          </TabsContent>

          {/* TAB 3: Autogestión Corporativa (Mi Empresa) */}
          <TabsContent value="company">
            <CompanyManagementTab
              companyData={adminUsers.companyData}
              onUpdateCompany={adminUsers.handleUpdateCompanyInfo}
            />
          </TabsContent>

          {/* TAB 4: User Account & Assignment Control */}
          <TabsContent value="control">
            <UserAccountControlTab
              students={adminUsers.users}
              dbModules={adminUsers.dbModules}
              newUserName={adminUsers.newUserName}
              setNewUserName={adminUsers.setNewUserName}
              newUserEmail={adminUsers.newUserEmail}
              setNewUserEmail={adminUsers.setNewUserEmail}
              newUserPassword={adminUsers.newUserPassword}
              setNewUserPassword={adminUsers.setNewUserPassword}
              newUserRole={adminUsers.newUserRole}
              setNewUserRole={adminUsers.setNewUserRole}
              newUserRut={adminUsers.newUserRut}
              setNewUserRut={adminUsers.setNewUserRut}
              newUserHireDate={adminUsers.newUserHireDate}
              setNewUserHireDate={adminUsers.setNewUserHireDate}
              isCreatingUser={adminUsers.isCreatingUser}
              onCreateUser={async () => { await adminUsers.handleCreateUser(); }}
              onDeleteUser={adminUsers.handleDeleteUser}
              onChangeUserRole={adminUsers.handleChangeUserRole}
              onResetPassword={adminUsers.handleResetUserPassword}
              onChangeUserHireDate={adminUsers.handleChangeUserHireDate}
              onChangeUserRut={adminUsers.handleChangeUserRut}
              onChangeUserName={adminUsers.handleChangeUserName}
              currentAdminId={adminUsers.currentAdminId}
              assignUserId={adminUsers.assignUserId}
              setAssignUserId={adminUsers.setAssignUserId}
              assignModuleId={adminUsers.assignModuleId}
              setAssignModuleId={adminUsers.setAssignModuleId}
              isAssigning={adminUsers.isAssigning}
              onAssignModule={async () => { await adminUsers.handleAssignModule(); }}
              onAssignModuleDirectly={async (userId, modId) => { await adminUsers.handleAssignModuleDirectly(userId, modId); }}
              onUnassignModuleDirectly={async (userId, modId) => { await adminUsers.handleUnassignModuleDirectly(userId, modId); }}
            />
          </TabsContent>

          {/* TAB 5: Interactive Theory & Quiz Builder */}
          <TabsContent value="content">
            <TheoryContentBuilderTab
              dbModules={adminUsers.dbModules}
              editContentModuleId={theoryBuilder.editContentModuleId}
              setEditContentModuleId={theoryBuilder.setEditContentModuleId}
              contentSections={theoryBuilder.contentSections}
              draftSections={theoryBuilder.draftSections}
              isLoadingContent={theoryBuilder.isLoadingContent}
              isSavingContent={theoryBuilder.isSavingContent}
              isGeneratingAi={theoryBuilder.isGeneratingAi}
              selectedSectionId={theoryBuilder.selectedSectionId}
              editSecTitle={theoryBuilder.editSecTitle}
              setEditSecTitle={theoryBuilder.setEditSecTitle}
              editSecContent={theoryBuilder.editSecContent}
              setEditSecContent={theoryBuilder.setEditSecContent}
              editSecVideo={theoryBuilder.editSecVideo}
              setEditSecVideo={theoryBuilder.setEditSecVideo}
              editSecImage={theoryBuilder.editSecImage}
              setEditSecImage={theoryBuilder.setEditSecImage}
              editSecAiSummary={theoryBuilder.editSecAiSummary}
              setEditSecAiSummary={theoryBuilder.setEditSecAiSummary}
              editSecAiExplanationText={theoryBuilder.editSecAiExplanationText}
              setEditSecAiExplanationText={theoryBuilder.setEditSecAiExplanationText}
              editSecAiAnalogy={theoryBuilder.editSecAiAnalogy}
              setEditSecAiAnalogy={theoryBuilder.setEditSecAiAnalogy}
              onSelectSection={theoryBuilder.loadSectionFromDraft}
              onAddSection={theoryBuilder.handleAddNewContentSection}
              onSaveAllSections={theoryBuilder.handleSaveAllContentSections}
              onGenerateAi={theoryBuilder.handleGenerateAiForCurrentSection}
              contentTextareaRef={theoryBuilder.contentTextareaRef}
              insertBold={theoryBuilder.insertBold}
              insertBullet={theoryBuilder.insertBullet}
              insertNumberedList={theoryBuilder.insertNumberedList}
              updateDraftField={theoryBuilder.updateDraftField}
              quizManager={quizManager}
              onRenameModule={async (id, title, desc) => { await adminUsers.handleRenameModule(id, title, desc); }}
              onCreateModule={async (title, desc) => { await adminUsers.handleCreateModule(title, desc); }}
              onDeleteSection={theoryBuilder.handleDeleteContentSection}
              onDeleteModule={async (modId: string) => {
                const ok = await adminUsers.handleDeleteModule(modId);
                if (ok) {
                  const remaining = adminUsers.dbModules.filter(m => m.id !== modId);
                  theoryBuilder.setEditContentModuleId(remaining.length > 0 ? remaining[0].id : "");
                }
                return ok;
              }}
            />
          </TabsContent>
        </Tabs>
      </>
    )}
  </main>
</div>
  );
}
