import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { parseNaturalLanguageSearch } from '@/lib/groq';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Sparkles,
  X,
  Loader2,
  Smartphone,
  BookOpen,
  Armchair,
  Dumbbell,
  Bike,
  Music,
  ShoppingBag,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const categoryIcons: Record<string, React.ReactNode> = {
  Electronics: <Smartphone className="h-4 w-4" />,
  Books: <BookOpen className="h-4 w-4" />,
  Furniture: <Armchair className="h-4 w-4" />,
  Appliances: <Wind className="h-4 w-4" />,
  Sports: <Dumbbell className="h-4 w-4" />,
  Vehicles: <Bike className="h-4 w-4" />,
  'Music & Arts': <Music className="h-4 w-4" />,
};

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedCondition, priceRange, sortBy]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const loadProducts = async () => {
    console.log('[Marketplace] Loading products...');
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, seller:users(*), category:categories(*)')
        .eq('status', 'available');

      if (selectedCategory) {
        const categoryData = categories.find((c) => c.slug === selectedCategory);
        if (categoryData) {
          console.log('[Marketplace] Filtering by category:', categoryData.name);
          query = query.eq('category_id', categoryData.id);
        }
      }
      if (selectedCondition) {
        console.log('[Marketplace] Filtering by condition:', selectedCondition);
        query = query.eq('condition', selectedCondition);
      }
      if (priceRange.min) {
        query = query.gte('price', parseFloat(priceRange.min));
      }
      if (priceRange.max) {
        query = query.lte('price', parseFloat(priceRange.max));
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('[Marketplace] Error loading products:', error);
      } else {
        console.log('[Marketplace] Loaded products:', data?.length || 0);
      }

      setProducts(data || []);
    } catch (err) {
      console.error('[Marketplace] Exception loading products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;

    setAiSearchLoading(true);
    try {
      const filters = await parseNaturalLanguageSearch(searchQuery);
      if (filters.category) {
        setSearchParams((prev: URLSearchParams) => {
          prev.set('category', filters.category!);
          return prev;
        });
        setSelectedCategory(filters.category);
      }
      if (filters.minPrice) {
        setPriceRange((prev) => ({ ...prev, min: filters.minPrice!.toString() }));
      }
      if (filters.maxPrice) {
        setPriceRange((prev) => ({ ...prev, max: filters.maxPrice!.toString() }));
      }
      if (filters.condition) {
        setSelectedCondition(filters.condition);
      }
      if (filters.query) {
        setSearchQuery(filters.query);
      }
      loadProducts();
    } catch (error) {
      console.error('AI Search error:', error);
    } finally {
      setAiSearchLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    selectedCategory || selectedCondition || priceRange.min || priceRange.max || searchQuery;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-8">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Marketplace</h1>
            <p className="text-white/80">Find the best deals on campus</p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-background border-b py-4">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Try: 'I need a laptop under 30000'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  className="pl-10 pr-20"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-cyan-500"
                  onClick={handleAiSearch}
                  disabled={aiSearchLoading}
                >
                  {aiSearchLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline ml-1 text-xs">AI Search</span>
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="w-full lg:w-[130px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {conditionOptions.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your search results</SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="Max"
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Price Range Desktop */}
            <div className="hidden lg:flex gap-2">
              <Input
                placeholder="Min Price"
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                className="w-28"
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                className="w-28"
              />
            </div>

            {/* View Toggle */}
            <div className="hidden lg:flex border rounded-md overflow-hidden">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  {searchQuery}
                  <button onClick={() => setSearchQuery('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCondition && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCondition}
                  <button onClick={() => setSelectedCondition('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(priceRange.min || priceRange.max) && (
                <Badge variant="secondary" className="gap-1">
                  {priceRange.min ? `₹${priceRange.min}` : '₹0'} -{' '}
                  {priceRange.max ? `₹${priceRange.max}` : '∞'}
                  <button onClick={() => setPriceRange({ min: '', max: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Bar */}
      <section className="border-b py-3 overflow-x-auto">
        <div className="container px-4">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory ? 'outline' : 'default'}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setSelectedCategory('')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {categoryIcons[cat.name]}
                <span className="ml-1 hidden sm:inline">{cat.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="container px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              )}
            >
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Link to="/sell">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  List your first product
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
