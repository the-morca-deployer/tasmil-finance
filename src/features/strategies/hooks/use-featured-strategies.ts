"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedStrategies } from "../services";
import type { FeaturedStrategy } from "../types";

export function useFeaturedStrategies() {
  return useQuery<FeaturedStrategy[]>({
    queryKey: ["featured-strategies"],
    queryFn: () => getFeaturedStrategies(),
  });
}
