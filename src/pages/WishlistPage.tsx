import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wishlist')
      .select('*, product:products(*, seller:users(*), category:categories(*))')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    setProducts(data?.map((w) => w.product).filter(Boolean) || []);
    setLoading(false);
  };

  const removeFromWishlist = async (productId: string) => {
    await supabase
      .from('wishlist')
      .delete()
      .match({ user_id: user?.id, product_id: productId });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to view your wishlist</h2>
          <Link to="/auth/signin">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground">{products.length} items saved</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : products.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="relative"
                >
                  <ProductCard product={product} />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    Remove
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding products to your wishlist
            </p>
            <Link to="/marketplace">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
