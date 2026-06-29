import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Clock,
  Heart,
  Share2,
  MessageCircle,
  Sparkles,
  CheckCircle,
  Shield,
  ArrowLeft,
  Loader2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const conditionColors: Record<string, string> = {
  New: 'bg-green-500/10 text-green-500 border-green-500/30',
  'Like New': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Good: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Fair: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  Poor: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, seller:users(*), category:categories(*)')
      .eq('id', id)
      .single();

    if (data) {
      setProduct(data);
      // Increment views
      await supabase
        .from('products')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);
    }
    setLoading(false);
  };

  const toggleWishlist = async () => {
    if (!user || !product) {
      navigate('/auth/signin');
      return;
    }

    setWishlisting(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .match({ user_id: user.id, product_id: product.id });
        setIsWishlisted(false);
        toast({ title: 'Removed from wishlist' });
      } else {
        await supabase.from('wishlist').insert({
          user_id: user.id,
          product_id: product.id,
        });
        setIsWishlisted(true);
        toast({ title: 'Added to wishlist' });
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    } finally {
      setWishlisting(false);
    }
  };

  const handleContact = () => {
    if (!user || !product) {
      navigate('/auth/signin');
      return;
    }

    navigate(`/messages?user=${product.seller_id}${product.id ? `&product=${product.id}` : ''}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: product?.title,
        text: `Check out ${product?.title} on CampusKart AI for ₹${product?.price}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const isOwnProduct = user?.id === product.seller_id;

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container max-w-6xl px-4">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Carousel className="w-full">
                <CarouselContent>
                  {product.images?.length > 0 ? (
                    product.images.map((img, i) => (
                      <CarouselItem key={i}>
                        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                          <img
                            src={img}
                            alt={`${product.title} ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem>
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center">
                        <Sparkles className="h-24 w-24 text-blue-500/50" />
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                {product.images?.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>

              {/* Thumbnail strip */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Details */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={cn(conditionColors[product.condition])}>
                  {product.condition}
                </Badge>
                {product.negotiable && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    Negotiable
                  </Badge>
                )}
                {product.category && (
                  <Badge variant="secondary">{product.category.name}</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.title}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.original_price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {product.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Listed {timeAgo(product.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {product.views} views
                </div>
              </div>

              {/* AI Summary */}
              {product.ai_summary && (
                <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">AI Summary</p>
                        <p className="text-sm text-muted-foreground">{product.ai_summary}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {product.features?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="space-y-1">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Seller Info */}
              {product.seller && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={product.seller.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            {product.seller.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{product.seller.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.seller.college_name}
                          </p>
                        </div>
                      </div>
                      <Link to={`/user/${product.seller.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm text-green-500">
                      <Shield className="h-4 w-4" />
                      Verified College Student
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!isOwnProduct ? (
                  <>
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                      onClick={handleContact}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Seller
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleWishlist}
                      disabled={wishlisting}
                    >
                      <Heart
                        className={cn(
                          'h-5 w-5',
                          isWishlisted && 'fill-red-500 text-red-500'
                        )}
                      />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <Link to={`/edit-product/${product.id}`} className="flex-1">
                    <Button className="w-full">Edit Listing</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
