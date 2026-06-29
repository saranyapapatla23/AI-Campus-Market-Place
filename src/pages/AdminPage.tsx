import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  Shield,
  Loader2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type { User, Product, Report } from '@/types';

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    pendingReports: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    if (user?.is_admin) loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);

    const [usersRes, productsRes, reportsRes, ordersCount] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('products').select('*, seller:users(*), category:categories(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*, product:products(*), reporter:users(*)').order('created_at', { ascending: false }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    setUsers(usersRes.data || []);
    setProducts(productsRes.data || []);
    setReports(reportsRes.data || []);

    setStats({
      totalUsers: usersRes.count || 0,
      totalProducts: productsRes.count || 0,
      activeProducts: productsRes.data?.filter((p) => p.status === 'available').length || 0,
      pendingReports: reportsRes.data?.filter((r) => r.status === 'pending').length || 0,
      totalOrders: ordersCount.count || 0,
    });

    setLoading(false);
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    await supabase
      .from('reports')
      .update({ status: action })
      .eq('id', reportId);
    loadAdminData();
  };

  const handleProductStatus = async (productId: string, status: string) => {
    await supabase
      .from('products')
      .update({ status })
      .eq('id', productId);
    loadAdminData();
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container px-4">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage CampusKart marketplace</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                { label: 'Total Products', value: stats.totalProducts, icon: ShoppingBag, color: 'text-green-500' },
                { label: 'Active Listings', value: stats.activeProducts, icon: TrendingUp, color: 'text-cyan-500' },
                { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-yellow-500' },
                { label: 'Total Orders', value: stats.totalOrders, icon: BarChart3, color: 'text-purple-500' },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users">
              <TabsList className="mb-6">
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reports
                  {stats.pendingReports > 0 && (
                    <Badge variant="destructive" className="ml-2">{stats.pendingReports}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>College</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.full_name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.college_name}</TableCell>
                            <TableCell>
                              {u.is_admin ? (
                                <Badge className="bg-blue-500">Admin</Badge>
                              ) : (
                                <Badge variant="outline">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(u.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>All Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell>{p.seller?.full_name}</TableCell>
                            <TableCell>₹{p.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant={p.status === 'available' ? 'default' : 'secondary'}
                              >
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProductStatus(p.id, 'sold')}
                                >
                                  Mark Sold
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProductStatus(p.id, 'draft')}
                                >
                                  Hide
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reports.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <p>No reports to review</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.product?.title || 'N/A'}</TableCell>
                              <TableCell>{r.reason}</TableCell>
                              <TableCell>{r.reporter?.full_name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    r.status === 'pending'
                                      ? 'destructive'
                                      : r.status === 'resolved'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {r.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {r.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleReportAction(r.id, 'resolved')}
                                    >
                                      Resolve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleReportAction(r.id, 'dismissed')}
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
