import { TokenIcon } from "@web3icons/react/dynamic";
import { Bot, ChevronRight, Settings, Sparkles } from "lucide-react";
import Image from "next/image";
import type { Assistant } from "@/gen/types/assistant";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardFooter, CardHeader } from "@/shared/ui/card";

// Define metadata interface based on the response structure
interface AssistantMetadata {
  id?: string;
  icon?: string;
  name?: string;
  tags?: string[];
  type?: "Strategy" | "Intelligence";
  author?: string;
  version?: string;
  category?: string;
  created_by?: string;
  description?: string[];
  capabilities?: string[];
  supportedChains?: string[];
}

interface AgentCardProps {
  assistant: Assistant;
  onClick: () => void;
}

// Map chain name to token symbol for web3icons
const getChainTokenSymbol = (chainName: string): string => {
  const chainMap: Record<string, string> = {
    ethereum: "eth",
    eth: "eth",
    arbitrum: "arb",
    avalanche: "avax",
    avax: "avax",
    bnb: "bnb",
    bnbchain: "bnb", // Added for "BNB Chain"
    bsc: "bnb",
    base: "base",
    blast: "blast",
    celo: "celo",
    fantom: "ftm",
    gnosis: "gno",
    linea: "linea",
    manta: "manta",
    mantle: "mnt",
    metis: "metis",
    mode: "mode",
    moonbeam: "glmr",
    optimism: "op",
    op: "op",
    polygon: "matic",
    scroll: "scr",
    solana: "sol",
    aurora: "aurora",
    zksync: "zk",
    u2u: "u2u", // In case it falls through
    u2unetwork: "u2u", // Added for "U2U Network"
  };

  const normalized = chainName.toLowerCase().replace(/\s+/g, "");
  return chainMap[normalized] || normalized;
};

// Check if chain is U2U (use PNG instead of web3icons)
const isU2UChain = (chainName: string): boolean => {
  const normalized = chainName.toLowerCase().replace(/\s+/g, "");
  return normalized === "u2u" || normalized === "u2usolaris" || normalized === "u2unetwork";
};

// Chain icon component
function ChainIcon({ chain, size = 20 }: { chain: string; size?: number }) {
  if (isU2UChain(chain)) {
    return (
      <Image
        src="/images/tokens/u2u.png"
        alt="U2U"
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return <TokenIcon symbol={getChainTokenSymbol(chain)} variant="branded" size={size} />;
}

export function AgentCard({ assistant, onClick }: AgentCardProps) {
  const metadata = assistant.metadata as AssistantMetadata;

  const agentName = metadata?.name || assistant.name || "Unknown Agent";
  const agentType = metadata?.type || "Intelligence";
  const agentIcon = metadata?.icon;
  const agentDescription = metadata?.description || ["No description available"];
  const supportedChains = metadata?.supportedChains || [];

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden border-border bg-card p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="relative p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Agent Icon - Floating, Transparent, No Background */}
          <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
            {agentIcon ? (
              <Image
                src={agentIcon}
                alt={agentName}
                width={48}
                height={48}
                className="object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <Bot className="h-8 w-8 text-muted-foreground z-10" />
            )}
          </div>

          <Badge
            variant="outline"
            className={`border-border bg-background/50 backdrop-blur-md px-3 py-1 ${agentType === 'Strategy' ? 'text-accent-foreground' : 'text-primary'
              }`}
          >
            {agentType === 'Strategy' ? <Settings className="mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {agentType}
          </Badge>
        </div>

        {/* Content */}
        <div>
          <h3 className="mb-3 font-bold text-xl text-foreground group-hover:text-primary transition-colors">{agentName}</h3>
          <ul className="space-y-2 mb-6">
            {agentDescription.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground group-hover:bg-primary/50 transition-colors" />
                <span className="line-clamp-2 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardHeader>

      {/* Footer */}
      <CardFooter className="mt-auto border-t border-border bg-muted/20 p-4 group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Supported Chains</span>
            <div className="flex -space-x-2">
              {supportedChains.slice(0, 4).map((chain, i) => (
                <div key={i} className="h-6 w-6 rounded-full bg-background ring-2 ring-card flex items-center justify-center overflow-hidden">
                  <ChainIcon chain={chain} size={16} />
                </div>
              ))}
              {supportedChains.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                  +{supportedChains.length - 4}
                </div>
              )}
            </div>
          </div>

          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
