"use client";

export const dynamic = 'force-dynamic';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Book, Users, UserCheck } from "lucide-react";
import Link from 'next/link';
import { Logo } from "@/components/ui/logo";

import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useTheoryContentBuilder } from '@/hooks/useTheoryContentBuilder';
import { useQuizManager } from '@/hooks/useQuizManager';

import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { UserManagementTab } from '@/components/admin/UserManagementTab';
import { UserAccountControlTab } from '@/components/admin/UserAccountControlTab';
import { TheoryContentBuilderTab } from '@/components/admin/TheoryContentBuilderTab';

export default function AdminDashboard() {
  // 1. Users & General Admin Hook
  const adminUsers = useAdminUsers();

  // 2. Theory Content Builder Hook
  const theoryBuilder = useTheoryContentBuilder(adminUsers.dbModules);

  // 3. Quiz Manager Hook (Synchronized with selected theory module)
  const quizManager = useQuizManager(adminUsers.dbModules, theoryBuilder.editContentModuleId);

  if (adminUsers.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Admin Header */}
      <header className="bg-white/90 backdrop-blur-md text-brand-blue px-6 py-4 shadow-sm border-b border-brand-blue/10 sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-brand-blue hover:bg-brand-lightblue/20 border border-brand-blue/10 rounded-full shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Logo className="hidden sm:block" />
              <span className="text-brand-green font-black px-3 border-l border-brand-blue/20 ml-2 hidden sm:inline mt-2.5 leading-none uppercase tracking-wide">Panel de administración</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">Director de Capacitación</p>
              <p className="text-xs text-slate-500 font-medium">Panel de Seguridad Día Cero</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Top Metric Cards Component */}
        <AdminStatsCards 
          totalStudents={adminUsers.totalStudents}
          averageProgress={adminUsers.averageProgress}
          completedStudents={adminUsers.completedStudents}
        />

        {/* Tabbed Navigation */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1.5 border border-slate-200 shadow-sm rounded-2xl flex flex-col sm:flex-row flex-wrap h-auto gap-1.5 w-full sm:w-auto">
            <TabsTrigger value="users" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <Users className="h-4 w-4" />
              Nómina & Progreso Académico
            </TabsTrigger>
            <TabsTrigger value="control" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <UserCheck className="h-4 w-4" />
              Control de Cuentas & Asignaciones
            </TabsTrigger>
            <TabsTrigger value="content" className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all flex items-center justify-center sm:justify-start gap-2">
              <Book className="h-4 w-4" />
              Constructor Teórico & Quizzes
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
            />
          </TabsContent>

          {/* TAB 2: User Account & Assignment Control */}
          <TabsContent value="control">
            <UserAccountControlTab
              students={adminUsers.students}
              dbModules={adminUsers.dbModules}
              newUserName={adminUsers.newUserName}
              setNewUserName={adminUsers.setNewUserName}
              newUserEmail={adminUsers.newUserEmail}
              setNewUserEmail={adminUsers.setNewUserEmail}
              newUserPassword={adminUsers.newUserPassword}
              setNewUserPassword={adminUsers.setNewUserPassword}
              isCreatingUser={adminUsers.isCreatingUser}
              onCreateUser={adminUsers.handleCreateUser}
              onResetPassword={adminUsers.handleResetUserPassword}
              assignUserId={adminUsers.assignUserId}
              setAssignUserId={adminUsers.setAssignUserId}
              assignModuleId={adminUsers.assignModuleId}
              setAssignModuleId={adminUsers.setAssignModuleId}
              isAssigning={adminUsers.isAssigning}
              onAssignModule={adminUsers.handleAssignModule}
            />
          </TabsContent>

          {/* TAB 3: Theory Content Builder & Quiz Manager */}
          <TabsContent value="content">
            <TheoryContentBuilderTab
              dbModules={adminUsers.dbModules}
              editContentModuleId={theoryBuilder.editContentModuleId}
              setEditContentModuleId={theoryBuilder.setEditContentModuleId}
              contentSections={theoryBuilder.contentSections}
              draftSections={theoryBuilder.draftSections}
              selectedSectionId={theoryBuilder.selectedSectionId}
              isLoadingContent={theoryBuilder.isLoadingContent}
              isSavingContent={theoryBuilder.isSavingContent}
              isGeneratingAi={theoryBuilder.isGeneratingAi}
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
              updateDraftField={theoryBuilder.updateDraftField}
              quizManager={quizManager}
              onRenameModule={adminUsers.handleRenameModule}
              onCreateModule={adminUsers.handleCreateModule}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
