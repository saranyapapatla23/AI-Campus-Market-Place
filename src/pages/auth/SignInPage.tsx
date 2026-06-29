import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'failed'>('checking');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
  }, []);

  const addDebug = (msg: string) => {
    console.log('[SignIn]', msg);
    setDebugInfo((prev) => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const checkConnection = async () => {
    addDebug('Checking Supabase connection...');
    setConnectionStatus('checking');

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    addDebug(`URL: ${url ? url.substring(0, 35) + '...' : 'MISSING'}`);
    addDebug(`Key: ${key ? 'SET (' + key.substring(0, 10) + '...)' : 'MISSING'}`);

    if (!url || !key) {
      addDebug('ERROR: Missing environment variables!');
      setConnectionStatus('failed');
      return;
    }

    try {
      addDebug('Testing fetch to Supabase REST API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 404 || response.status === 401 || response.status === 403) {
        addDebug(`Connection OK! Status: ${response.status}`);
        setConnectionStatus('ok');
      } else {
        addDebug(`Unexpected status: ${response.status}`);
        setConnectionStatus('failed');
      }
    } catch (err: any) {
      addDebug(`Connection FAILED: ${err.message}`);
      console.error('[SignIn] Fetch error:', err);

      if (err.name === 'AbortError') {
        addDebug('Request timed out after 10s');
      } else if (err.message.includes('Failed to fetch')) {
        addDebug('Network/CORS error - check if Supabase URL is correct');
      }
      setConnectionStatus('failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    addDebug(`Attempting sign in for: ${email}`);

    try {
      addDebug('Calling signIn...');
      const result = await signIn(email, password);

      if (result.error) {
        addDebug(`Sign in failed: ${result.error}`);
        setError(result.error);
      } else {
        addDebug('Sign in successful! Navigating...');
        navigate('/');
      }
    } catch (err: any) {
      addDebug(`Exception: ${err.message}`);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      addDebug('handleSubmit completed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              CampusKart AI
            </span>
          </Link>
        </div>

        {/* Connection Status */}
        <Alert className={`mb-4 ${connectionStatus === 'ok' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : connectionStatus === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
          <div className="flex items-center gap-2">
            {connectionStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
            {connectionStatus === 'ok' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {connectionStatus === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <AlertDescription className="text-sm">
              {connectionStatus === 'checking' && 'Checking connection...'}
              {connectionStatus === 'ok' && 'Supabase connection OK'}
              {connectionStatus === 'failed' && 'Connection failed - check console for details'}
            </AlertDescription>
          </div>
        </Alert>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono max-h-32 overflow-y-auto">
            {debugInfo.map((info, i) => (
              <div key={i} className="text-muted-foreground">{info}</div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue to your campus marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || connectionStatus !== 'ok'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || connectionStatus !== 'ok'}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                disabled={loading || connectionStatus !== 'ok'}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Sign In
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-blue-500 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
