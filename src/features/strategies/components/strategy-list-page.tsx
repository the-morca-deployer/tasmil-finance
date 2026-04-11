"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { GlassCard, GlassCardContent, GlassCardFooter } from "@/shared/ui/glass-card";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useFeaturedStrategies, useStrategies } from "../hooks";
import type { FeaturedStrategy, StrategyListItem } from "../types";

// Helper for gradients based on index
const getGradient = (index: number) => {
  const gradients = [
    "from-cyan-500/10 to-blue-600/10",
    "from-purple-500/10 to-pink-600/10",
    "from-emerald-500/10 to-teal-600/10",
    "from-amber-500/10 to-orange-600/10",
  ];
  return gradients[index % gradients.length];
};

// Featured Strategy Card
function FeaturedStrategyCard({ strategy, index }: { strategy: FeaturedStrategy; index: number }) {
  return (
    <GlassCard className="group relative h-[240px] cursor-pointer overflow-hidden border-white/5 bg-zinc-900/40 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:shadow-lg">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)} opacity-30 transition-opacity group-hover:opacity-50`}
      />
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20" />

      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <Badge className="border-white/10 bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
            Featured
          </Badge>
          {/* Chain Logo Placeholder */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 backdrop-blur-sm">
            <span className="font-bold text-xs text-zinc-400">ETH</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-bold text-2xl text-white transition-colors group-hover:text-cyan-400">
            {strategy.name}
          </h3>
          <p className="line-clamp-2 text-sm text-zinc-400">{strategy.description}</p>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="-bottom-20 -right-20 absolute h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/30" />
    </GlassCard>
  );
}

// Strategy Card for Grid View
function StrategyCard({
  strategy,
  onClick,
  index,
}: {
  strategy: StrategyListItem;
  onClick: () => void;
  index: number;
}) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <GlassCard
      className="group hover:-translate-y-1 cursor-pointer border-white/5 bg-zinc-900/40 p-0 transition-all duration-300 hover:border-white/10 hover:bg-zinc-800/60 hover:shadow-xl"
      onClick={onClick}
    >
      <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${getGradient(index)}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between">
          <div className="-space-x-2 flex">
            {strategy.assets?.slice(0, 3).map((asset, i) => (
              <div
                key={i}
                className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 font-bold text-[10px] text-zinc-400"
              >
                {asset.alt.charAt(0)}
              </div>
            ))}
          </div>
          {strategy.hasPoints && (
            <Badge className="border-amber-500/20 bg-amber-500/20 text-amber-300 backdrop-blur-md">
              <Zap className="mr-1 h-3 w-3 fill-current" /> Points
            </Badge>
          )}
        </div>
      </div>

      <GlassCardContent className="px-5 pt-4 pb-2">
        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono text-cyan-500/80">Strategy</span>
          <span>•</span>
          <span>{strategy.chain?.alt || "Ethereum"}</span>
        </div>
        <h3 className="mb-1 font-bold text-lg text-white transition-colors group-hover:text-cyan-400">
          {strategy.title}
        </h3>

        <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
          {strategy.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-white/5 bg-white/5 px-2 py-0.5 font-normal text-[10px] text-zinc-400"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </GlassCardContent>

      <GlassCardFooter className="flex justify-between rounded-b-xl border-white/5 border-t bg-black/20 px-5 py-4">
        <div>
          <p className="font-semibold text-[10px] text-zinc-500 uppercase tracking-widest">
            Net APY
          </p>
          <p
            className={cn(
              "font-bold text-lg",
              isNegative && "text-rose-400",
              isPositive && "text-emerald-400",
              !isNegative && !isPositive && "text-zinc-400"
            )}
          >
            {strategy.current_apy}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 font-semibold text-[10px] text-zinc-500 uppercase tracking-widest">
            Risk Level
          </p>
          <div className="mt-1 flex items-center justify-end gap-1">
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/80" />
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/30" />
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/30" />
          </div>
        </div>
      </GlassCardFooter>
    </GlassCard>
  );
}

// Strategy Row for List View
function StrategyRow({ strategy, onClick }: { strategy: StrategyListItem; onClick: () => void }) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <GlassCard
      className="group cursor-pointer border-white/5 bg-zinc-900/40 p-4 transition-all hover:translate-x-1 hover:border-white/10 hover:bg-zinc-800/60"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title and Tags */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="-space-x-2 flex">
              {strategy.assets?.slice(0, 2).map((asset, i) => (
                <div
                  key={i}
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 font-bold text-[10px] text-zinc-400"
                >
                  {asset.alt.charAt(0)}
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white transition-colors group-hover:text-cyan-400">
                {strategy.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{strategy.chain?.alt || "Ethereum"}</span>
                {strategy.hasPoints && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Zap className="h-3 w-3 fill-current" /> Points
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Stats */}
        <div className="flex items-center gap-12">
          <div>
            <p className="mb-0.5 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              Pool Type
            </p>
            <div className="flex gap-1">
              {strategy.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-white/5 bg-white/5 text-[10px] text-zinc-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="min-w-[80px] text-right">
            <p className="mb-0.5 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              APY
            </p>
            <span
              className={cn(
                "font-bold text-base",
                isNegative && "text-rose-400",
                isPositive && "text-emerald-400",
                !isNegative && !isPositive && "text-zinc-400"
              )}
            >
              {strategy.current_apy}
            </span>
          </div>
        </div>

        <div className="border-white/5 border-l pl-4">
          <ChevronRight className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-white" />
        </div>
      </div>
    </GlassCard>
  );
}

// Filter Dialog Component
function FilterDialog({
  categories,
  selectedCategories,
  onCategoriesChange,
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {selectedCategories.length > 0 && (
            <Badge className="ml-2 h-5 border-0 bg-cyan-500/20 px-1.5 text-cyan-400 text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Filter Strategies</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select categories to filter strategies
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-white">Categories</h4>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoriesChange([])}
                  className="h-auto p-0 text-xs text-zinc-400 hover:text-white"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className={cn(
                    "cursor-pointer select-none border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-white/20",
                    selectedCategories.includes(category) &&
                      "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                  )}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                  {selectedCategories.includes(category) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StrategyListPageProps {
  className?: string;
}

export function StrategyListPage({ className }: StrategyListPageProps) {
  const router = useRouter();
  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const { data: featuredStrategies, isLoading: featuredLoading } = useFeaturedStrategies();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const handleStrategyClick = (strategyId: string) => {
    router.push(`/strategies/${strategyId}`);
  };

  // Get unique categories from strategies
  const categories = Array.from(
    new Set(strategies?.map((s) => s.category).filter(Boolean) as string[])
  ).sort();

  const filteredStrategies = strategies?.filter((strategy) => {
    const matchesSearch =
      strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      strategy.assets?.some((asset) =>
        asset.alt.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      strategy.agents?.some((agent) =>
        agent.alt.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      strategy.chain?.alt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && strategy.status === "Active") ||
      (statusFilter === "inactive" && strategy.status === "Inactive") ||
      (statusFilter === "paused" && strategy.status === "Paused");

    const matchesCategory =
      selectedCategories.length === 0 ||
      (strategy.category && selectedCategories.includes(strategy.category));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const isLoading = strategiesLoading || featuredLoading;

  const statusLabels: Record<string, string> = {
    all: "All",
    active: "Active",
    inactive: "Inactive",
    paused: "Paused",
  };

  if (isLoading) {
    return (
      <div className={cn("mx-auto max-w-[1600px] space-y-8 p-6 lg:p-10", className)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[240px] rounded-xl bg-zinc-900/50" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64 bg-zinc-900/50" />
            <Skeleton className="h-10 w-32 bg-zinc-900/50" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl bg-zinc-900/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-zinc-950", className)}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-zinc-900 to-zinc-950 px-6 py-12 lg:px-10">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
        {/* Background Gradients */}
        <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />

        <div className="relative mx-auto flex max-w-[1600px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 py-1 pr-4 pl-2 backdrop-blur-md">
              <Badge className="border-0 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30">
                New
              </Badge>
              <span className="font-medium text-xs text-zinc-300">Prompt-to-DeFi is now live</span>
            </div>
            <h1 className="font-bold text-4xl text-white leading-[1.1] tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                Intelligent
              </span>{" "}
              DeFi Strategies
            </h1>
            <p className="max-w-lg text-lg text-zinc-400 leading-relaxed">
              Deploy capital into automated yield strategies powered by the{" "}
              <span className="font-medium text-white">INFINIT AI Agent Swarm</span>.
            </p>
          </div>

          {/* Stats / CTA */}
          <div className="flex gap-4">
            <GlassCard className="min-w-[160px] border-white/5 bg-zinc-900/40 p-6 text-center">
              <p className="font-bold text-sm text-zinc-500 uppercase tracking-widest">Total TVL</p>
              <p className="mt-1 font-bold text-3xl text-white">$42.8M</p>
            </GlassCard>
            <GlassCard className="min-w-[160px] border-white/5 bg-zinc-900/40 p-6 text-center">
              <p className="font-bold text-sm text-zinc-500 uppercase tracking-widest">
                Active Agents
              </p>
              <p className="mt-1 font-bold text-3xl text-white">128</p>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-12 p-6 lg:p-10">
        {/* Featured Strategies */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-2xl text-white">Featured Opportunities</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                onClick={() => setFeaturedIndex(Math.max(0, featuredIndex - 1))}
                disabled={featuredIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                onClick={() =>
                  setFeaturedIndex(
                    Math.min((featuredStrategies?.length || 1) - 3, featuredIndex + 1)
                  )
                }
                disabled={featuredIndex >= (featuredStrategies?.length || 1) - 3}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredStrategies?.slice(featuredIndex, featuredIndex + 3).map((strategy, idx) => (
              <FeaturedStrategyCard key={strategy.id} strategy={strategy} index={idx} />
            ))}
          </div>
        </section>

        {/* All Strategies */}
        <section>
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="font-bold text-2xl text-white">Explore Strategies</h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="group relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-cyan-500" />
                <Input
                  placeholder="Search assets, agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-[240px] rounded-full border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-cyan-500/50 md:w-[320px]"
                />
              </div>

              {/* Filters */}
              <FilterDialog
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
              />

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[100px] border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                  >
                    {statusLabels[statusFilter]}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                    Paused
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="mx-1 hidden h-6 w-[1px] bg-white/10 md:block" />

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md transition-all",
                    viewMode === "grid"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md transition-all",
                    viewMode === "list"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Strategies Grid or List */}
          {filteredStrategies && filteredStrategies.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStrategies.map((strategy, idx) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    index={idx}
                    onClick={() => handleStrategyClick(strategy.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStrategies.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    onClick={() => handleStrategyClick(strategy.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                <Search className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="font-medium text-lg text-white">No strategies found</p>
              <p className="mt-1 mb-4 text-zinc-500">Try adjusting your filters or search terms</p>
              {(searchQuery || selectedCategories.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategories([]);
                  }}
                  className="border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
