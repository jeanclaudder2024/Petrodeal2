import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, UserPlus, BarChart3, Mail, Settings, Target } from 'lucide-react';
import CandidatesTab from './CandidatesTab';
import AssessmentBuilderTab from './AssessmentBuilderTab';
import SimulationProfilesTab from './SimulationProfilesTab';
import TalentEmailTemplatesTab from './TalentEmailTemplatesTab';
import TalentAnalyticsTab from './TalentAnalyticsTab';
import TalentSettingsTab from './TalentSettingsTab';

const TalentProgramsManagement = () => {
  const [activeTab, setActiveTab] = useState('candidates');

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Growth Talent Assessment System
          </CardTitle>
          <CardDescription>
            Manage invite-only talent assessments, candidate evaluations, and simulation programs
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 h-auto">
          <TabsTrigger value="candidates" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Candidates</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2 py-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Profiles</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2 py-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <CandidatesTab />
        </TabsContent>

        <TabsContent value="assessment">
          <AssessmentBuilderTab />
        </TabsContent>

        <TabsContent value="profiles">
          <SimulationProfilesTab />
        </TabsContent>

        <TabsContent value="emails">
          <TalentEmailTemplatesTab />
        </TabsContent>

        <TabsContent value="analytics">
          <TalentAnalyticsTab />
        </TabsContent>

        <TabsContent value="settings">
          <TalentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TalentProgramsManagement;
