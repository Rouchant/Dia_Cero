"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Lock } from "lucide-react";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock authentication
    setTimeout(() => {
      localStorage.setItem('dia_cero_auth', 'true');
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="bg-primary p-2 rounded-xl">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-headline font-black tracking-tighter text-primary">DiaCero</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-primary/5">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Pilot Access</CardTitle>
          <CardDescription>Enter your credentials to access the learning module</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="pilot@diacero.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary font-medium hover:underline">Forgot password?</button>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-primary/10"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center border-t py-6 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="#" className="text-primary font-bold hover:underline">Apply for pilot access</Link>
          </p>
        </CardFooter>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground/60 max-w-xs text-center">
        This is a controlled pilot release. For technical assistance, please contact help@diacero.com
      </p>
    </div>
  );
}
