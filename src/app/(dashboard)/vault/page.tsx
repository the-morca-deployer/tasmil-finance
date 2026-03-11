"use client";

import { Check, Send } from "lucide-react";
import { useState } from "react";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";
import { NetworkIcon, TokenIcon } from "@web3icons/react/dynamic";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/lib/utils";

// Mock Data
const STRATEGIES = [
  {
    id: "conservative",
    title: "Conservative",
    subtitle: "Most Risk-Averse Strategy",
    stats: { apy: "5.26%", rewardApy: "2.27%", tvl: "$1.38M" },
    active: true,
  },
  {
    id: "aggressive",
    title: "Aggressive",
    subtitle: "Chase the Highest Yield. More risks.",
    stats: { apy: "7.89%", rewardApy: "2.27%", tvl: "$9.23M" },
    active: false,
  },
];

const CHAINS = [
  { id: "base", name: "Base", network: "base" },
  { id: "arbitrum", name: "Arbitrum", network: "arbitrum-one" },
  { id: "plasma", name: "Plasma", network: "plasma", variant: "mono", className: "text-white" },
  { id: "sonic", name: "Sonic", network: "sonic", variant: "mono", className: "text-white" },
];

const PROTOCOLS = [
  { id: "aave", name: "Aave", symbol: "aave" },
  { id: "compound", name: "Compound", symbol: "comp" },
  { id: "fluid", name: "Fluid", symbol: "instadapp" }, // Fluid is Instadapp's protocol, best guess for icon
  { id: "moonwell", name: "Moonwell", symbol: "well" },
  { id: "morpho", name: "Morpho", symbol: "morpho" },
  { id: "spark", name: "Spark", symbol: "dai" }, // Spark is Maker/DAI related
];

export default function VaultPage() {
  const [selectedStrategy, setSelectedStrategy] = useState("conservative");
  const [selectedChains, setSelectedChains] = useState<string[]>(["base"]);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(["aave", "morpho", "spark"]);
  const [agentName, setAgentName] = useState("");

  // Settings
  const [omniAccount, setOmniAccount] = useState(false);
  const [autoCompounding, setAutoCompounding] = useState(true);
  const [splitting, setSplitting] = useState(false);

  const toggleChain = (id: string) => {
    setSelectedChains(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleProtocol = (id: string) => {
    setSelectedProtocols(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Tasmil Vault">
      <div className="relative min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
        {/* Overlay with Blur */}
        <div className="absolute inset-0 bg-background/30 backdrop-blur-sm z-40 pointer-events-none rounded-lg" />

        {/* Coming Soon Button */}
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
          <Button
            size="lg"
            disabled
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold"
          >
            Coming Soon
          </Button>
        </div>
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-8 gap-8">
            <TabsTrigger
              value="markets"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-lg text-muted-foreground data-[state=active]:text-foreground font-medium"
            >
              Markets
            </TabsTrigger>
            <TabsTrigger
              value="execution"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-lg text-muted-foreground data-[state=active]:text-foreground font-medium"
            >
              Execution
            </TabsTrigger>
          </TabsList>

          {/* MARKETS TAB */}
          <TabsContent value="markets" className="space-y-10 focus-visible:outline-none">

            {/* 1. Strategy Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-foreground font-semibold mb-1">Strategy Selection</h3>
                <p className="text-muted-foreground text-sm">These strategies gives access to more or less protocols according to the strategy type.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy.id)}
                    className={cn(
                      "relative p-px rounded-2xl cursor-pointer transition-all duration-300 group",
                      selectedStrategy === strategy.id
                        ? "bg-linear-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className="bg-background rounded-2xl p-6 h-full flex flex-col items-center text-center relative z-10">
                      <h4 className="text-xl font-bold text-foreground mb-1">{strategy.title}</h4>
                      <p className="text-muted-foreground text-xs mb-6">{strategy.subtitle}</p>

                      <div className="grid grid-cols-3 w-full gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last 30d APY</p>
                          <p className="font-mono font-bold text-primary tracking-tight text-lg">{strategy.stats.apy}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reward APY</p>
                          <p className="font-mono font-bold text-primary tracking-tight text-lg">{strategy.stats.rewardApy}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">TVL</p>
                          <p className="font-mono font-bold text-primary tracking-tight text-lg">{strategy.stats.tvl}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Chain Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-foreground font-semibold mb-1">Chain Selection</h3>
                <p className="text-muted-foreground text-sm mb-3">Select the chain you allow agent to interact with:</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-4 w-4 rounded border border-input bg-transparent" />
                  <span className="text-xs text-foreground">Select All</span>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* @ts-ignore */}
                {CHAINS.map((chain) => (
                  <div
                    key={chain.id}
                    onClick={() => toggleChain(chain.id)}
                    className={cn(
                      "h-14 w-20 rounded-xl border flex items-center justify-center relative cursor-pointer transition-all",
                      selectedChains.includes(chain.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-muted border-input hover:border-muted-foreground"
                    )}
                  >
                    <NetworkIcon
                      id={chain.network}
                      // @ts-ignore
                      variant={chain.variant || "branded"}
                      // @ts-ignore
                      className={chain.className}
                      size={32}
                    />

                    {/* Checkmark for active */}
                    {selectedChains.includes(chain.id) && (
                      <div className="absolute bottom-1 right-1 h-3 w-3 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Protocols Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-foreground font-semibold mb-1">Protocols Selection</h3>
                <p className="text-muted-foreground text-sm mb-3">Select the protocols you allow agent to interact with:</p>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-input bg-transparent flex items-center justify-center">
                      <Check className="h-3 w-3 text-foreground" />
                    </div>
                    <span className="text-foreground">Unselect All</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-input bg-transparent" />
                    <span className="text-muted-foreground">Auto-approve future protocols</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROTOCOLS.map((protocol) => (
                  <div
                    key={protocol.id}
                    onClick={() => toggleProtocol(protocol.id)}
                    className={cn(
                      "p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden group",
                      selectedProtocols.includes(protocol.id)
                        ? "bg-muted border-input"
                        : "bg-muted/50 border-input opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* Gradient BG active */}
                    {selectedProtocols.includes(protocol.id) && (
                      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
                    )}

                    <div className="shrink-0">
                      <TokenIcon symbol={protocol.symbol} variant="branded" size={32} />
                    </div>
                    <span className="font-semibold text-foreground">{protocol.name}</span>

                    {/* Checkbox visual */}
                    <div className={cn(
                      "ml-auto h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      selectedProtocols.includes(protocol.id)
                        ? "bg-primary border-primary"
                        : "border-input bg-transparent"
                    )}>
                      {selectedProtocols.includes(protocol.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-lg mt-8">
              Deploy my smart account on Base
            </Button>

          </TabsContent>

          {/* EXECUTION TAB */}
          <TabsContent value="execution" className="space-y-10 focus-visible:outline-none">

            <div className="mb-6">
              <p className="text-muted-foreground text-sm">Your Agent, your rules — adjust how it manages your funds.</p>
            </div>

            <div className="max-w-2xl space-y-10">

              {/* Name */}
              <div className="space-y-3">
                <label className="text-foreground font-semibold">Name Your Agent</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter the name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="flex-1 bg-muted border border-input rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                </div>
              </div>

              {/* Omni Account */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-foreground font-semibold text-sm">Omni Account</h4>
                    <p className="text-muted-foreground text-xs mt-1 max-w-sm">
                      Omni Account makes your funds work as one balance across all networks.
                      Only for <span className="text-primary underline">whitelisted</span> users.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={omniAccount} onCheckedChange={setOmniAccount} />
                  <span className="text-sm text-foreground">Bridge tokens</span>
                </div>
              </div>

              {/* Auto Compounding */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-foreground font-semibold text-sm">Auto-compounding</h4>
                  <p className="text-muted-foreground text-xs mt-1">
                    Decide if you want your earnings to be automatically reinvested to maximize returns over time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={autoCompounding} onCheckedChange={setAutoCompounding} />
                  <span className="text-sm text-foreground">Auto-compounding</span>
                </div>
              </div>

              {/* Splitting */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-foreground font-semibold text-sm">Splitting</h4>
                  <p className="text-muted-foreground text-xs mt-1">
                    Splits your funds across multiple pools for higher yields and improved risk diversification.
                    Available when you deposit more than $100k.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={splitting} onCheckedChange={setSplitting} />
                  <span className="text-sm text-foreground">Allow splitting</span>
                </div>
              </div>

              {/* Telegram */}
              <div className="pt-8 opacity-50 pointer-events-none">
                <h4 className="text-foreground font-semibold text-sm mb-2">Telegram Agent Notifications</h4>
                <p className="text-muted-foreground text-xs mb-4">Link your Telegram account to receive notifications about your agent rebalancing and updates.</p>

                <div className="rounded-xl border border-input bg-muted/50 p-6 flex flex-col items-center justify-center gap-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                  <Button variant="outline" className="w-full max-w-xs border-input text-muted-foreground">Link Telegram</Button>
                </div>
              </div>

            </div>

          </TabsContent>
        </Tabs>
      </div>
    </MultiSidebarLayout>
  );
}
