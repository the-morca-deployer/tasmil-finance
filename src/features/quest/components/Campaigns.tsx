"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/features/quest/components/ui/card-v2';
import { Avatar, AvatarImage, AvatarFallback } from '@/features/quest/components/ui/avatar';
import { Badge } from '@/features/quest/components/ui/badge';
import { Separator } from '@/features/quest/components/ui/separator';
import { useCampaignsControllerFindAll } from '@/gen-quest/hooks/campaigns-hooks';
import { mapApiCampaignsResponse } from '@/features/quest/lib/campaign-mapper';
import { withAuth } from '@/features/quest/lib/kubb-config';

const Campaigns: React.FC = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'closed'>('all');

  // Build query params based on filter
  const queryParams = useMemo(() => {
    if (filter === 'all') {
      return undefined; // Fetch all campaigns
    }
    return {
      active: filter === 'ongoing', // true for ongoing, false for closed
    };
  }, [filter]);

  // Fetch campaigns with caching
  const { data, isLoading, error } = useCampaignsControllerFindAll(queryParams, {
    ...withAuth,
    query: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Use cached data if available
      refetchOnReconnect: false,
    },
  });

  // Map API response to Campaign interface
  const campaigns = useMemo(() => {
    if (!data) return [];
    return mapApiCampaignsResponse(data);
  }, [data]);

  // Filter campaigns client-side (for status filtering)
  const filteredCampaigns = useMemo(() => {
    if (filter === 'all') return campaigns;
    return campaigns.filter(c => c.status === filter);
  }, [campaigns, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted">Discover the latest quests and earn rewards.</p>
        </div>

        <div className="flex items-center bg-card border border-border rounded-full p-1">
          {['all', 'ongoing', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                ? 'bg-brand-gradient text-background shadow-lg'
                : 'text-muted hover:text-primary'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center text-muted">
          <Loader2 size={48} className="mx-auto mb-4 opacity-20 animate-spin" />
          <p>Loading campaigns...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="py-20 text-center text-muted">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>Failed to load campaigns. Please try again later.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
          <Card
            key={campaign.id}
            hoverEffect
            onClick={() => router.push(`/quest/campaign/${campaign.id}`)}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="relative h-48 w-full border-b border-border">
              <img
                src={campaign.banner}
                alt={campaign.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                {campaign.status === 'ongoing' && <Badge variant="default">Ongoing</Badge>}
                {campaign.status === 'closed' && <Badge variant="secondary">Closed</Badge>}
              </div>
            </div>

            <CardHeader className="flex-grow pb-4">
              <CardTitle className="text-lg line-clamp-1 mb-2">{campaign.title}</CardTitle>
              <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
            </CardHeader>

            <div className="px-6">
              <Separator />
            </div>

            <CardFooter className="pt-4 justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2 items-center">
                  {(() => {
                    const campaignAvatars = campaign.avatars || [];
                    const maxAvatars = 5;
                    const avatarsToShow = campaignAvatars.slice(0, maxAvatars);
                    const remainingCount = campaign.participants - avatarsToShow.length;
                    
                    return (
                      <>
                        {avatarsToShow.map((avatar, i) => (
                          <Avatar key={i} className="w-6 h-6 border-2 border-card">
                            <AvatarImage src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        {avatarsToShow.length === 0 && campaign.participants > 0 && Array.from({ length: Math.min(campaign.participants, 3) }, (_, i) => i + 1).map((i) => (
                          <Avatar key={i} className="w-6 h-6 border-2 border-card">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        {remainingCount > 0 && (
                          <div className="w-6 h-6 rounded-full border-2 border-card bg-muted/10 flex items-center justify-center text-[8px] font-bold text-muted">
                            {remainingCount >= 1000 
                              ? `+${(remainingCount / 1000).toFixed(0)}k`
                              : `+${remainingCount}`
                            }
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-success font-medium">
                <Trophy size={14} />
                <span>{campaign.points} PTS</span>
              </div>
            </CardFooter>
          </Card>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredCampaigns.length === 0 && (
        <div className="py-20 text-center text-muted">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>No campaigns found.</p>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
