import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { User as UserType, Product, Rating } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  ShoppingBag,
  Star,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'ChemE', 'Others'];

export default function ProfilePage() {
  const { id: profileId } = useParams();
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState<number | undefined>();
  const [hostel, setHostel] = useState('');

  const isOwnProfile = !profileId || profileId === user?.id;

  useEffect(() => {
    loadProfile();
  }, [profileId, user]);

  const loadProfile = async () => {
    setLoading(true);
    const targetId = profileId || user?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    setProfile(userData);

    if (userData) {
      setFullName(userData.full_name);
      setBio(userData.bio || '');
      setPhone(userData.phone || '');
      setDepartment(userData.department || '');
      setSemester(userData.semester);
      setHostel(userData.hostel || '');
    }

    const { data: productData } = await supabase
      .from('products')
      .select('*, seller:users(*), category:categories(*)')
      .eq('seller_id', targetId)
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    setProducts(productData || []);

    const { data: ratingData } = await supabase
      .from('ratings')
      .select('*, rater:users!ratings_rater_id_fkey(*)')
      .eq('rated_user_id', targetId);
    setRatings(ratingData || []);

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile({
      full_name: fullName,
      bio,
      phone,
      department,
      semester,
      hostel,
    });
    if (!result.error) {
      setEditing(false);
      loadProfile();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container max-w-4xl px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            {/* Cover */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>

            {/* Avatar and Info */}
            <div className="relative px-6 pb-6">
              <Avatar className="h-24 w-24 border-4 border-background absolute -top-12 left-6">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  {profile.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="pt-14">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                      {profile.is_verified && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{profile.college_name}</p>
                  </div>
                  {isOwnProfile && !editing && (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-sm text-muted-foreground">Listings</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ratings.length} reviews</p>
                  </div>
                </div>

                {/* Info */}
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {profile.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {profile.department} - Semester {profile.semester}
                    </div>
                  )}
                  {profile.hostel && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.hostel}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>

                {profile.bio && !editing && (
                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Edit Form */}
        {editing && isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 rounded-md border px-3"
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(parseInt(e.target.value))}
                      className="w-full h-10 rounded-md border px-3"
                    >
                      <option value="">Select</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hostel</Label>
                  <Input value={hostel} onChange={(e) => setHostel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="listings" className="mt-8">
          <TabsList>
            <TabsTrigger value="listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Listings ({products.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews ({ratings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {products.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active listings</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {rating.rater?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {rating.rater?.full_name || 'Anonymous'}
                            </p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i < rating.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {rating.review}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
