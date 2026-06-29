import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Eye,
  Package,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyListingsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadProducts();
  }, [user]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('seller_id', user?.id)
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('products').update({ status }).eq('id', id);
    loadProducts();
  };

  const activeListings = products.filter((p) => p.status === 'available');
  const soldListings = products.filter((p) => p.status === 'sold');
  const draftListings = products.filter((p) => p.status === 'draft');

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-muted-foreground">{products.length} total listings</p>
          </div>
          <Link to="/sell">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-6">
              Start selling your unused items to fellow students
            </p>
            <Link to="/sell">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active ({activeListings.length})
              </TabsTrigger>
              <TabsTrigger value="sold">
                Sold ({soldListings.length})
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts ({draftListings.length})
              </TabsTrigger>
            </TabsList>

            {['active', 'sold', 'drafts'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(tab === 'active'
                    ? activeListings
                    : tab === 'sold'
                    ? soldListings
                    : draftListings
                  ).map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative group"
                    >
                      <ProductCard product={product} />
                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {tab === 'active' && (
                          <>
                            <Link to={`/edit-product/${product.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateStatus(product.id, 'sold')}
                            >
                              Mark Sold
                            </Button>
                          </>
                        )}
                        {tab === 'drafts' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(product.id, 'available')}
                          >
                            Publish
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The listing will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProduct(product.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {/* Views badge */}
                      {tab === 'active' && (
                        <div className="absolute top-3 right-14">
                          <Badge variant="secondary" className="bg-black/50 text-white">
                            <Eye className="h-3 w-3 mr-1" />
                            {product.views}
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
