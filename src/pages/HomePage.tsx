import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Sparkles,
  Shield,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
  MessageCircle,
  BookOpen,
  Smartphone,
  Armchair,
  Dumbbell,
  Bike,
  Music,
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  Electronics: <Smartphone className="h-6 w-6" />,
  Books: <BookOpen className="h-6 w-6" />,
  Furniture: <Armchair className="h-6 w-6" />,
  Sports: <Dumbbell className="h-6 w-6" />,
  Vehicles: <Bike className="h-6 w-6" />,
  'Music & Arts': <Music className="h-6 w-6" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, categoriesRes, productsCount, usersCount, ordersCount] =
          await Promise.all([
            supabase
              .from('products')
              .select('*, seller:users(*), category:categories(*)')
              .eq('status', 'available')
              .order('created_at', { ascending: false })
              .limit(8),
            supabase.from('categories').select('*').order('name'),
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id', { count: 'exact', head: true }),
          ]);

        setFeaturedProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setStats({
          products: productsCount.count || 0,
          users: usersCount.count || 0,
          orders: ordersCount.count || 0,
        });
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0v15m0 15v-15m0-15v15m0 15' stroke='%234a5568' stroke-width='0.5' fill='none'/%3E%3C/svg%3E\")" }} />
        <div className="container relative px-4 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Marketplace
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Buy & Sell Smart on
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                CampusKart AI
              </span>
            </h1>
            <p className="mb-8 text-lg text-slate-300">
              Your intelligent campus marketplace for second-hand products. AI-powered search, smart pricing, and personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/marketplace">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Browse Marketplace
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Sell with AI
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 flex justify-center gap-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.products}+</div>
              <div className="text-sm text-slate-400">Products Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.users}+</div>
              <div className="text-sm text-slate-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.orders}+</div>
              <div className="text-sm text-slate-400">Sales Made</div>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-background">
            <path d="M0,32L80,37.3C160,43,320,53,480,58.7C640,64,800,64,960,58.7C1120,53,1280,43,1360,37.3L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Listings',
                description: 'Generate compelling product descriptions, smart pricing suggestions, and recommendations automatically.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Shield,
                title: 'College-Verified',
                description: 'All users are verified with college email addresses. Safe transactions within your campus community.',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                icon: MessageCircle,
                title: 'Real-time Chat',
                description: 'Connect directly with buyers and sellers. Negotiate prices and arrange meetups easily.',
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full bg-gradient-to-br from-card to-muted/50 border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Popular Categories</h2>
              <p className="text-muted-foreground">Browse by category</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {categories.slice(0, 6).map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Link to={`/marketplace?category=${category.slug}`}>
                  <Card className="group hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-colors">
                        {categoryIcons[category.name] || (
                          <ShoppingBag className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <p className="font-medium text-sm">{category.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-500" />
                Featured Listings
              </h2>
              <p className="text-muted-foreground">New & trending products</p>
            </div>
            <Link to="/marketplace">
              <Button variant="ghost">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No products listed yet</p>
              <Link to="/sell">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  Be the first to sell
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-muted-foreground">Simple steps to buy or sell</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              { step: 1, title: 'Sign Up', desc: 'Register with your college email', icon: Users },
              { step: 2, title: 'List Product', desc: 'AI helps create your listing', icon: Sparkles },
              { step: 3, title: 'Find Buyers', desc: 'Chat and negotiate directly', icon: MessageCircle },
              { step: 4, title: 'Complete Sale', desc: 'Exchange and rate each other', icon: Star },
            ].map((item) => (
              <motion.div key={item.step} variants={itemVariants} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              Recent Activity
            </h2>
            <p className="text-muted-foreground">What's happening on CampusKart</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              'Laptop sold for ₹28,000',
              'New listing: Mechanical Keyboard',
              'ECE student joined',
              'Book traded for hostel essentials',
            ].map((activity, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm truncate">{activity}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 p-8 lg:p-12 text-center"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Join thousands of students buying and selling on campus. It's free, fast, and AI-powered.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  Explore Products
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
