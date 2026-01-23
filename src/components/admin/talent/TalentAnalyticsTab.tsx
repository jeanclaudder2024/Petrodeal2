import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Download,
  Globe,
  Target,
  Loader2
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TalentAnalyticsTab = () => {
  // Fetch candidates for analytics
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['talent-analytics-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_candidates')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  // Fetch stage progress for completion analytics
  const { data: stageProgress } = useQuery({
    queryKey: ['talent-analytics-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_stage_progress')
        .select('*, talent_stages(name, stage_number)');

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const totalCandidates = candidates?.length || 0;
  const pending = candidates?.filter((c) => c.status === 'pending').length || 0;
  const shortlisted = candidates?.filter((c) => c.status === 'shortlisted').length || 0;
  const invited = candidates?.filter((c) => c.status === 'invited').length || 0;
  const inProgress = candidates?.filter((c) => c.status === 'in_progress').length || 0;
  const completed = candidates?.filter((c) => c.status === 'completed').length || 0;
  const passed = candidates?.filter((c) => c.status === 'passed').length || 0;
  const failed = candidates?.filter((c) => c.status === 'failed').length || 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Shortlisted', value: shortlisted, color: '#3b82f6' },
    { name: 'Invited', value: invited, color: '#8b5cf6' },
    { name: 'In Progress', value: inProgress, color: '#f97316' },
    { name: 'Passed', value: passed, color: '#10b981' },
    { name: 'Failed', value: failed, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Country distribution
  const countryData = candidates?.reduce((acc, c) => {
    const country = c.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryChartData = Object.entries(countryData || {})
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Language distribution
  const languageData = candidates?.reduce((acc, c) => {
    const lang = c.preferred_language?.toUpperCase() || 'EN';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageChartData = Object.entries(languageData || {}).map(([language, count]) => ({
    language,
    count,
  }));

  // Interest areas
  const interestData = candidates?.reduce((acc, c) => {
    const interest = c.area_of_interest || 'Other';
    acc[interest] = (acc[interest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const interestChartData = Object.entries(interestData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Funnel data
  const funnelData = [
    { stage: 'Applied', count: totalCandidates },
    { stage: 'Shortlisted', count: shortlisted + invited + inProgress + completed + passed + failed },
    { stage: 'Invited', count: invited + inProgress + completed + passed + failed },
    { stage: 'Started', count: inProgress + completed + passed + failed },
    { stage: 'Completed', count: completed + passed + failed },
    { stage: 'Passed', count: passed },
  ];

  // Conversion rates
  const conversionRate = totalCandidates > 0 ? ((passed / totalCandidates) * 100).toFixed(1) : '0';
  const completionRate =
    invited > 0 ? (((completed + passed + failed) / invited) * 100).toFixed(1) : '0';
  const passRate = completed + passed + failed > 0 
    ? ((passed / (completed + passed + failed)) * 100).toFixed(1) 
    : '0';

  // Export to CSV
  const exportToCsv = () => {
    if (!candidates) return;

    const headers = [
      'Name',
      'Email',
      'Country',
      'City',
      'Interest',
      'Language',
      'Status',
      'Score',
      'Applied Date',
    ];

    const rows = candidates.map((c) => [
      c.full_name,
      c.email,
      c.country || '',
      c.city || '',
      c.area_of_interest || '',
      c.preferred_language,
      c.status,
      c.final_score?.toString() || '',
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talent-candidates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
                <p className="text-3xl font-bold">{totalCandidates}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">{passRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{completionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Funnel</CardTitle>
            <CardDescription>Progression through assessment stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current candidate statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interest Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Areas of Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interestChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {interestChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Language Preferences</span>
            <Button variant="outline" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {languageChartData.map((lang) => (
              <div key={lang.language} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{lang.count}</div>
                <div className="text-sm text-muted-foreground">{lang.language}</div>
                <Progress
                  value={(lang.count / totalCandidates) * 100}
                  className="mt-2 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentAnalyticsTab;
