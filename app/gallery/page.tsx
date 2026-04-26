"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Heart, Zap, Users, Timer, Target } from "lucide-react";

const classes = [
  {
    id: 1,
    name: "CrossFit",
    description: "High-intensity functional training combining cardio, weightlifting, and gymnastics",
    duration: "60 min",
    level: "All Levels",
    icon: Zap,
    color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30",
  },
  {
    id: 2,
    name: "Yoga & Stretching",
    description: "Improve flexibility, balance, and mental wellness with guided yoga sessions",
    duration: "45 min",
    level: "Beginner Friendly",
    icon: Heart,
    color: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    id: 3,
    name: "Personal Training",
    description: "One-on-one coaching tailored to your specific fitness goals and needs",
    duration: "60 min",
    level: "Custom",
    icon: Target,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: 4,
    name: "Cardio Blast",
    description: "High-energy cardio workouts to boost endurance and burn calories",
    duration: "45 min",
    level: "Intermediate",
    icon: Timer,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
  {
    id: 5,
    name: "Strength Training",
    description: "Build muscle and power with our comprehensive weight training programs",
    duration: "60 min",
    level: "All Levels",
    icon: Dumbbell,
    color: "from-primary/20 to-lime-600/20",
    borderColor: "border-primary/30",
  },
  {
    id: 6,
    name: "Group Fitness",
    description: "Fun and motivating group classes led by our expert trainers",
    duration: "50 min",
    level: "All Levels",
    icon: Users,
    color: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-500/30",
  },
];

export default function ClassesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-lg md:text-xl font-display font-bold text-primary uppercase tracking-widest">
              Our Classes
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase mb-3">
            Fitness Classes
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            Choose from our wide range of classes designed to help you reach your fitness goals
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const Icon = classItem.icon;
            return (
              <div
                key={classItem.id}
                className={`group relative rounded-2xl border ${classItem.borderColor} bg-gradient-to-br ${classItem.color} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,252,0,0.15)]`}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,252,0,0.1),transparent_50%)]" />
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold text-white mb-2">
                    {classItem.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 leading-relaxed">
                    {classItem.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                      {classItem.duration}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                      {classItem.level}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
