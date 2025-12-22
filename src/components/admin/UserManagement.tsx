import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Shield, TrendingUp, User, Briefcase, Rocket, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  email_confirmed_at?: string;
  role?: string;
  last_sign_in_at?: string;
}

interface SubscriberStats {
  basic: number;
  professional: number;
  enterprise: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats>({ basic: 0, professional: 0, enterprise: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchSubscriberStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Use RPC function directly - this is the reliable method
      const { data: usersData, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) throw error;
      
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberStats = async () => {
    try {
      const { data, error } = await db
        .from('subscribers')
        .select('subscription_tier');

      if (error) throw error;

      const stats: SubscriberStats = { basic: 0, professional: 0, enterprise: 0 };
      
      (data || []).forEach((sub: { subscription_tier: string | null }) => {
        if (sub.subscription_tier === 'basic') stats.basic++;
        else if (sub.subscription_tier === 'professional') stats.professional++;
        else if (sub.subscription_tier === 'enterprise') stats.enterprise++;
      });

      setSubscriberStats(stats);
    } catch (error) {
      console.error('Failed to fetch subscriber stats:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First delete existing role
      await db
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await db
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully"
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'broker': return <Shield className="h-4 w-4" />;
      case 'trader': return <TrendingUp className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'broker': return 'bg-gold';
      case 'trader': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts and permissions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Overview - Row 1: User Roles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {users.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <div className="text-2xl font-bold text-gold">
                {users.filter(u => u.role === 'broker').length}
              </div>
              <div className="text-sm text-muted-foreground">Brokers</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {users.filter(u => u.role === 'trader').length}
              </div>
              <div className="text-sm text-muted-foreground">Traders</div>
            </div>
          </div>

          {/* Stats Overview - Row 2: Subscription Tiers */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
              <Briefcase className="h-5 w-5 text-sky-600" />
              <div>
                <div className="text-xl font-bold text-sky-600">{subscriberStats.basic}</div>
                <div className="text-xs text-muted-foreground">Traders Basic</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <Rocket className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold text-purple-600">{subscriberStats.professional}</div>
                <div className="text-xs text-muted-foreground">Traders Professional</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Building2 className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-xl font-bold text-amber-600">{subscriberStats.enterprise}</div>
                <div className="text-xs text-muted-foreground">Traders Enterprise</div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.first_name && (
                            <div className="text-sm text-muted-foreground">
                              {user.first_name} {user.last_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role || 'user')}`} />
                          {getRoleIcon(user.role || 'user')}
                          <Badge variant="outline" className="capitalize">
                            {user.role || 'user'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="trader">Trader</SelectItem>
                            <SelectItem value="broker">Broker</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;