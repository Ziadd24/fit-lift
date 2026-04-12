"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useAdminLogin } from "@/lib/api-hooks";
import { Button, Card, Input, Label } from "@/components/ui/PremiumComponents";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { setAdminToken } = useAuth();
  const router = useRouter();
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (res) => {
          if (res.success && res.token) {
            setAdminToken(res.token);
            router.push("/admin");
          }
        },
        onError: () => {
          setError("Invalid admin credentials");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-card border border-white/10 rounded-2xl mx-auto flex items-center justify-center mb-4 box-glow">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display text-white">
            System <span className="text-primary">Admin</span>
          </h1>
          <p className="text-muted-foreground mt-2">Authorized personnel only</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
