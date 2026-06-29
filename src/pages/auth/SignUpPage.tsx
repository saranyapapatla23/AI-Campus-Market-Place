import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Mail, Lock, User, Building2, ArrowRight, Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const COLLEGES = [
  'IIT Delhi',
  'IIT Bombay',
  'IIT Madras',
  'IIT Kanpur',
  'IIT Kharagpur',
  'NIT Trichy',
  'NIT Karnataka',
  'BITS Pilani',
  'Delhi University',
  'JNU Delhi',
  'Other',
];

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'failed'>('checking');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
  }, []);

  const addDebug = (msg: string) => {
    console.log('[SignUp]', msg);
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
      console.error('[SignUp] Fetch error:', err);
      setConnectionStatus('failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    addDebug(`Attempting sign up for: ${email}`);

    try {
      const result = await signUp(email, password, fullName, college);
      setLoading(false);

      if (result.error) {
        addDebug(`Sign up failed: ${result.error}`);
        setError(result.error);
      } else {
        addDebug('Sign up successful!');
        setSuccess(true);
        setTimeout(() => navigate('/auth/signin'), 3000);
      }
    } catch (err: any) {
      setLoading(false);
      addDebug(`Exception: ${err.message}`);
      setError('An unexpected error occurred');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Account Created!</h2>
              <p className="text-muted-foreground">
                Check your email for a confirmation link, then sign in.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join your campus marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                Use your college email (.edu, .ac.in, .edu.in) to verify your student status.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || connectionStatus !== 'ok'}
                  />
                </div>
              </div>

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
                <Label htmlFor="college">College</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    required
                    disabled={loading || connectionStatus !== 'ok'}
                  >
                    <option value="">Select your college</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || connectionStatus !== 'ok'}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                disabled={loading || connectionStatus !== 'ok'}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/auth/signin" className="text-blue-500 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
