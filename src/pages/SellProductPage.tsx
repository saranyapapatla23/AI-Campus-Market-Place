import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { generateProductDescription, getPriceRecommendation } from '@/lib/groq';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
  Coins,
  MapPin,
  Tag,
  FileText,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import type { Category } from '@/types';

const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function SellProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [age, setAge] = useState('0');
  const [location, setLocation] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState('');

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [priceRecommendation, setPriceRecommendation] = useState<{
    minimumPrice: number;
    recommendedPrice: number;
    maximumPrice: number;
    reason: string;
  } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev.slice(0, 4), e.target!.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const generateWithAI = async () => {
    if (!title || !category) {
      return;
    }

    setAiGenerating(true);
    try {
      const result = await generateProductDescription(
        title,
        categories.find((c) => c.id === category)?.name || '',
        condition
      );

      setDescription(result.description);
      setFeatures(result.features);
      setTags(result.tags);
      setAiSummary(result.summary);
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const getAiPriceRecommendation = async () => {
    if (!category || !condition || !price) return;

    setPriceLoading(true);
    try {
      const result = await getPriceRecommendation(
        categories.find((c) => c.id === category)?.name || '',
        condition,
        parseInt(age) || 0,
        parseFloat(originalPrice || price) || parseFloat(price),
        'medium'
      );
      setPriceRecommendation(result);
    } catch (error) {
      console.error('Price recommendation error:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || !category || !price || !location) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert({
        seller_id: user.id,
        title,
        description,
        ai_summary: aiSummary,
        category_id: category,
        condition,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        age_months: parseInt(age) || 0,
        location,
        negotiable,
        images,
        features,
        tags,
        status: 'available',
      });

      if (error) throw error;
      navigate('/my-listings');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = title && category && condition;
  const canProceedStep2 = price && location;
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <div className="min-h-screen pb-20 lg:pb-0 py-8">
      <div className="container max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold">Sell Your Product</h1>
          <p className="text-muted-foreground">AI will help you create an amazing listing</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Product Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., iPhone 13 Pro 256GB"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="condition">Condition *</Label>
                          <Select value={condition} onValueChange={setCondition}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {conditions.map((cond) => (
                                <SelectItem key={cond} value={cond}>
                                  {cond}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">How old is the product? (months)</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="e.g., 12"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Product Images (up to 5)</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {images.map((img, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded-lg overflow-hidden bg-muted"
                            >
                              <img
                                src={img}
                                alt={`Product ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {images.length < 5 && (
                            <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-1">Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        onClick={() => setStep(2)}
                        disabled={!canProceedStep1}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Pricing & Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Selling Price (₹) *</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="e.g., 25000"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="originalPrice">Original Price (₹)</Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            placeholder="e.g., 40000"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Negotiable?</Label>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={negotiable ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNegotiable(true)}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={!negotiable ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNegotiable(false)}
                          >
                            Fixed Price
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="location"
                            placeholder="e.g., Hostel Block A, IIT Delhi"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        onClick={() => setStep(3)}
                        disabled={!canProceedStep2}
                      >
                        Generate AI Content
                        <Sparkles className="h-4 w-4 ml-2" />
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        AI-Generated Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <AlertDescription>
                          AI will generate a description, features, and tags based on your product details.
                        </AlertDescription>
                      </Alert>

                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        onClick={generateWithAI}
                        disabled={aiGenerating}
                      >
                        {aiGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {aiGenerating ? 'Generating...' : 'Generate with AI'}
                      </Button>

                      {description && (
                        <>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={4}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Features</Label>
                            <div className="flex flex-wrap gap-2">
                              {features.map((feature, i) => (
                                <Badge key={i} variant="secondary">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag, i) => (
                                <Badge key={i} variant="outline">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>AI Summary</Label>
                            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                              {aiSummary}
                            </p>
                          </div>
                        </>
                      )}

                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        onClick={handleSubmit}
                        disabled={!canSubmit || loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Listing...' : 'List Product'}
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep(2)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - AI Price Recommendation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  AI Price Advisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={getAiPriceRecommendation}
                  disabled={priceLoading || !category || !condition || !price}
                >
                  {priceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Get Price Recommendation
                </Button>

                {priceRecommendation && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <p className="text-xs text-muted-foreground">Min</p>
                        <p className="font-semibold text-red-500">
                          ₹{priceRecommendation.minimumPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-muted-foreground">Recommended</p>
                        <p className="font-semibold text-blue-500">
                          ₹{priceRecommendation.recommendedPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <p className="text-xs text-muted-foreground">Max</p>
                        <p className="font-semibold text-green-500">
                          ₹{priceRecommendation.maximumPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {priceRecommendation.reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
