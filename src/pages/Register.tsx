import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    const requirements = [
      { test: pass.length >= 8, text: 'At least 8 characters' },
      { test: /[A-Z]/.test(pass), text: 'One uppercase letter' },
      { test: /[a-z]/.test(pass), text: 'One lowercase letter' },
      { test: /\d/.test(pass), text: 'One number' },
    ];
    return requirements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    if (password !== confirmPassword) {
      // This validation happens immediately without toast
      return;
    }

    const requirements = validatePassword(password);
    const unmetRequirements = requirements.filter(req => !req.test);
    
    if (unmetRequirements.length > 0) {
      // This validation happens immediately without toast
      return;
    }

    setIsLoading(true);

    try {
      // Use the AuthContext register method instead of direct fetch
      await register(username, email, password);
      
      // Only navigate on successful registration
      navigate('/dashboard');
    } catch (error) {
      // Error is already handled in AuthContext, but we can add specific UI feedback here
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = validatePassword(password);
  const isFormValid = username.trim() && email.trim() && password.trim() && 
                     confirmPassword.trim() && password === confirmPassword && 
                     passwordRequirements.every(req => req.test);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <Card className="glass shadow-2xl border-0">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gradient">
                Create Account
              </CardTitle>
              <CardDescription className="text-base">
                Join SQL Analytics and start analyzing data
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="pl-10 h-12 focus-ring transition-all duration-200"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 focus-ring transition-all duration-200"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10 h-12 focus-ring transition-all duration-200"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {password && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-muted-foreground">Password must contain:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            req.test ? 'bg-green-500' : 'bg-muted-foreground/40'
                          }`} />
                          <span className={`text-xs transition-colors ${
                            req.test ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          }`}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-12 focus-ring transition-all duration-200"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <p className="text-xs text-green-600 dark:text-green-400">Passwords match</p>
                  </div>
                )}
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 btn-glow transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner w-4 h-4" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Terms and Privacy */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-4">
                By creating an account, you agree to our{' '}
                <Link 
                  to="/terms" 
                  className="text-primary hover:text-primary/80 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link 
                  to="/privacy" 
                  className="text-primary hover:text-primary/80 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Privacy Policy
                </Link>
              </p>
              
              {/* Sign In Link */}
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>© 2024 SQL Analytics. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;