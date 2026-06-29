const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

async function callGroq<T>(
  messages: GroqMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<T> {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is not set in environment variables');
  }

  const request: GroqRequest = {
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from Groq API');
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error('Failed to parse Groq response as JSON');
  }
}

export interface ProductDescriptionResult {
  title: string;
  description: string;
  features: string[];
  tags: string[];
  summary: string;
}

export async function generateProductDescription(
  productTitle: string,
  category: string,
  condition: string,
  imageDescription?: string
): Promise<ProductDescriptionResult> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are an expert marketplace copywriter for a student college marketplace called CampusKart AI.
Generate attractive, student-friendly product listings. Always respond with valid JSON containing these exact keys: title, description, features (array of 5 strings), tags (array of 5 strings), summary.
Keep the tone friendly, helpful, and appealing to college students.
Make the title catchy but professional (max 60 chars).
Write a detailed description (100-150 words) highlighting the value proposition.
Features should be practical and relevant to students.
Tags should be searchable keywords.
Summary should be 1-2 sentences max.`,
    },
    {
      role: 'user',
      content: `Generate a marketplace listing for:
Product: ${productTitle}
Category: ${category}
Condition: ${condition}
${imageDescription ? `Image Details: ${imageDescription}` : ''}`,
    },
  ];

  return callGroq<ProductDescriptionResult>(messages, 0.8, 1000);
}

export interface PriceRecommendationResult {
  minimumPrice: number;
  recommendedPrice: number;
  maximumPrice: number;
  reason: string;
}

export async function getPriceRecommendation(
  category: string,
  condition: string,
  ageMonths: number,
  originalPrice: number,
  demand: string = 'medium'
): Promise<PriceRecommendationResult> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are an experienced second-hand marketplace pricing assistant for a student college marketplace.
Analyze the product details and suggest fair pricing in INR (Indian Rupees).
Always respond with valid JSON containing these exact keys: minimumPrice, recommendedPrice, maximumPrice, reason.
Prices should be numbers without currency symbols.
Consider: category depreciation rates, condition impact, age depreciation, market demand.
reason should be 2-3 sentences explaining the pricing logic.`,
    },
    {
      role: 'user',
      content: `Suggest pricing for:
Category: ${category}
Condition: ${condition}
Age: ${ageMonths} months
Original Price: ₹${originalPrice}
Current Market Demand: ${demand}`,
    },
  ];

  return callGroq<PriceRecommendationResult>(messages, 0.5, 500);
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: string;
  query?: string;
}

export async function parseNaturalLanguageSearch(query: string): Promise<SearchFilters> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are a search query parser for a student marketplace called CampusKart AI.
Parse natural language queries into structured filters.
Always respond with valid JSON containing these keys (all optional): category, minPrice, maxPrice, condition, sortBy, query.
Categories can be: Electronics, Books, Furniture, Appliances, Sports, Clothing, Hostel Essentials, Vehicles, Music & Arts, Others.
Conditions can be: New, Like New, Good, Fair, Poor.
sortBy can be: price_asc, price_desc, newest, popularity.
query should be the remaining search terms.
Only include keys that are relevant to the query. Price should be numbers only.`,
    },
    {
      role: 'user',
      content: `Parse this search query: "${query}"`,
    },
  ];

  return callGroq<SearchFilters>(messages, 0.3, 200);
}

export interface ChatResponse {
  response: string;
  productRecommendations?: string[];
  filters?: SearchFilters;
}

export async function chatWithAssistant(
  userMessage: string,
  context?: {
    department?: string;
    semester?: number;
    budget?: number;
    wishlist?: string[];
    recentSearches?: string[];
  }
): Promise<ChatResponse> {
  const contextStr = context
    ? `User context: Department: ${context.department || 'Unknown'}, Semester: ${context.semester || 'Unknown'}, Budget: ${context.budget ? `₹${context.budget}` : 'Not specified'}`
    : '';

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are CampusKart AI Assistant, a friendly helper for a student college marketplace.
Help students find products, get recommendations, and navigate the marketplace.
Be conversational, helpful, and student-friendly.
If the user asks for product recommendations, respond with JSON containing: response (your message), productRecommendations (array of product types to search for), filters (optional search filters).
If the user is just chatting or asking questions, just provide: response.
Keep responses concise (2-3 sentences) unless explaining something complex.
${contextStr}`,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  return callGroq<ChatResponse>(messages, 0.7, 500);
}

export interface ProductRecommendation {
  productId: string;
  title: string;
  reason: string;
  relevanceScore: number;
}

export async function getPersonalizedRecommendations(
  userId: string,
  userProfile: {
    department?: string;
    semester?: number;
    budget?: number;
  },
  wishlistCategories: string[],
  recentSearchTerms: string[]
): Promise<ProductRecommendation[]> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are a recommendation engine for a student college marketplace called CampusKart AI.
Based on user profile and behavior, generate personalized product recommendations.
Always respond with valid JSON containing an array of recommendations with keys: productId, title, reason, relevanceScore (0-100).
Provide up to 5 recommendations with diverse categories.`,
    },
    {
      role: 'user',
      content: `Generate recommendations for:
User ID: ${userId}
Profile: Department - ${userProfile.department || 'General'}, Semester - ${userProfile.semester || 1}, Budget - ${userProfile.budget ? `₹${userProfile.budget}` : 'Flexible'}
Interested Categories: ${wishlistCategories.join(', ') || 'None specified'}
Recent Searches: ${recentSearchTerms.join(', ') || 'None'}`,
    },
  ];

  const result = await callGroq<{ recommendations: ProductRecommendation[] }>(messages, 0.6, 800);
  return result.recommendations || [];
}

export async function analyzeImageDescription(imageUrl: string): Promise<string> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are an image description analyzer for a marketplace. Even though you cannot see images, when provided with image context, generate helpful product insights. Respond with a brief description string.`,
    },
    {
      role: 'user',
      content: `Analyze this product image URL and describe what the product appears to be (note: you cannot actually see images, so if asked to describe, provide general guidance): ${imageUrl}`,
    },
  ];

  return callGroq<string>(messages, 0.3, 100);
}

export { callGroq };
