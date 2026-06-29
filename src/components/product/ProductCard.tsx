import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MapPin, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const conditionColors: Record<string, string> = {
  New: 'bg-green-500/10 text-green-500 border-green-500/30',
  'Like New': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Good: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Fair: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  Poor: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card className="group overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-card border-none">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.images?.[0] && !imageError ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                <Sparkles className="h-12 w-12 text-blue-500/50" />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <Badge className={cn('text-xs', conditionColors[product.condition])}>
                {product.condition}
              </Badge>
              {product.negotiable && (
                <Badge variant="secondary" className="text-xs bg-white/90 text-gray-900">
                  Negotiable
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsWishlisted(!isWishlisted);
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                )}
              />
            </button>

            {/* AI Summary Badge */}
            {product.ai_summary && (
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-xs text-white/90">
                  <Sparkles className="h-3 w-3" />
                  <span className="truncate">{product.ai_summary}</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4">
            {/* Title */}
            <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-500 transition-colors">
              {product.title}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                ₹{product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center text-xs text-muted-foreground gap-3 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{product.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(product.created_at)}</span>
              </div>
            </div>

            {/* Seller */}
            {product.seller && (
              <div className="flex items-center gap-2 pt-3 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={product.seller.avatar_url} />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    {product.seller.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {product.seller.full_name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
