import { Award, Globe, Link as LinkIcon, MessageCircle, Send, Twitter } from "lucide-react";

export const COLORS = {
  neon: "#9DFF00",
  dark: "#02260F",
  deep: "#00301A",
  accent: "#B6FF2A",
  white: "#FFFFFF",
  lightGray: "#F4F7F6",
  softGray: "#7A8480",
};

export const NAV_LINKS = [
  { label: "Explore", href: "home" },
  { label: "Quests", href: "quests" },
  { label: "Leaderboard", href: "leaderboard" },
  { label: "For Projects", href: "create-quest" },
];

export const CHAINS = [
  { name: "Ethereum", symbol: "ETH", price: "$1,820.50", change: "+2.4%" },
  { name: "Solana", symbol: "SOL", price: "$24.10", change: "+5.1%" },
  { name: "Polygon", symbol: "MATIC", price: "$0.85", change: "+1.2%" },
  { name: "Arbitrum", symbol: "ARB", price: "$1.12", change: "-0.5%" },
  { name: "Optimism", symbol: "OP", price: "$1.45", change: "+3.2%" },
];

export const TESTIMONIALS = [
  {
    name: "CryptoExplorer",
    role: "NFT Collector",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    text: "doquest.xyz has completely changed how I find new projects. The rewards are real and instant.",
    company: "AlphaDAO",
  },
  {
    name: "MetaverseNinja",
    role: "DeFi Strategist",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    text: "I used to spend hours vetting projects. Now I just follow the quests and earn while I learn.",
    company: "YieldGuild",
  },
  {
    name: "ChainMaster",
    role: "Web3 Developer",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    text: "Launching our campaign on DoQuest brought us 5k+ real users in 48 hours. Best growth tool.",
    company: "BuildWeb3",
  },
];

export const FAQS = [
  {
    question: "How do I start earning rewards?",
    answer:
      "Simply connect your wallet, browse the available quests, complete the on-chain or social tasks, and claim your tokens or NFTs instantly.",
  },
  {
    question: "Is my wallet safe?",
    answer:
      "Yes. We use read-only permissions for verification. You never sign a transaction that moves funds unless you are explicitly minting a reward.",
  },
  {
    question: "Does it cost money to join?",
    answer:
      "No, doquest.xyz is free for users. Some quests may require gas fees on their respective blockchains, but we offer gasless quests too.",
  },
  {
    question: "How can I list my project?",
    answer:
      "Go to the 'For Projects' page and fill out the application. We verify all projects to ensure user safety.",
  },
  {
    question: "What chains do you support?",
    answer:
      "We support over 30 EVM and non-EVM chains including Ethereum, Solana, Polygon, Arbitrum, BSC, and Aptos.",
  },
];

export const QUESTS = [
  {
    id: "1",
    title: "Mission Bring ZETA Home",
    project: "ZetaChain",
    projectLogo:
      "https://images.unsplash.com/photo-1622630998477-20aa696fa4a5?auto=format&fit=crop&w=100&q=80",
    cover:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    nftImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    status: "Ongoing",
    dateRange: "2023/12/07 12:00 UTC - N/A",
    rewards: { type: "NFT", value: "Zeta Supporter Badge", points: 80 },
    chain: "BNB Chain",
    description:
      "As the crypto ecosystem awaits the launch of ZetaChain, we're teaming up with Quest3 to help users show their support. Complete the tasks below to earn your exclusive badge and gain early adopter status in the Zeta ecosystem.",
    participants: 12500,
    tasks: [
      {
        id: "t1",
        type: "twitter",
        icon: Twitter,
        text: "Follow @zetablockchain on X",
        status: "completed",
      },
      {
        id: "t2",
        type: "discord",
        icon: MessageCircle,
        text: "Join ZetaChain Discord Server",
        status: "pending",
      },
      {
        id: "t3",
        type: "telegram",
        icon: Send,
        text: "Join ZetaChain Telegram",
        status: "pending",
      },
      {
        id: "t4",
        type: "verify",
        icon: LinkIcon,
        text: "Verify Wallet Address",
        status: "pending",
      },
      {
        id: "t5",
        type: "claim",
        icon: Award,
        text: "1 Mission Bring ZETA Home NFT for current address",
        status: "locked",
      },
    ],
  },
  {
    id: "2",
    title: "ReSwap QuestN Campaign",
    project: "ReSwap",
    projectLogo:
      "https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?auto=format&fit=crop&w=100&q=80",
    cover:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    nftImage:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
    status: "Ongoing",
    dateRange: "2023/11/15 - 2024/01/15",
    rewards: { type: "Token", value: "500 USDT Pool", points: 150 },
    chain: "Polygon",
    description:
      "Celebrate the launch of ReSwap V2. Swap at least $10 worth of tokens to qualify for the prize pool.",
    participants: 4300,
    tasks: [
      { id: "t1", type: "twitter", icon: Twitter, text: "Follow @reswap on X", status: "pending" },
      { id: "t2", type: "website", icon: Globe, text: "Visit ReSwap Website", status: "pending" },
    ],
  },
  {
    id: "3",
    title: "Arbitrum Adventure",
    project: "Arbitrum DAO",
    projectLogo:
      "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=100&q=80",
    cover:
      "https://images.unsplash.com/photo-1639322537228-ad7117a394eb?auto=format&fit=crop&w=1200&q=80",
    nftImage:
      "https://images.unsplash.com/photo-1639322537228-ad7117a394eb?auto=format&fit=crop&w=600&q=80",
    status: "Ended",
    dateRange: "2023/10/01 - 2023/11/01",
    rewards: { type: "OAT", value: "Arb OAT", points: 50 },
    chain: "Arbitrum",
    description:
      "Explore the Arbitrum ecosystem. Bridge assets and interact with 3 dApps to earn this exclusive OAT.",
    participants: 45000,
    tasks: [],
  },
  {
    id: "4",
    title: "DeFi Summer 2.0",
    project: "Aave",
    projectLogo:
      "https://images.unsplash.com/photo-1622630998477-20aa696fa4a5?auto=format&fit=crop&w=100&q=80",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    nftImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    status: "Ongoing",
    dateRange: "2024/01/01 - 2024/02/01",
    rewards: { type: "Points", value: "Level 5 Access", points: 200 },
    chain: "Ethereum",
    description: "Supply liquidity to Aave V3 markets and earn boosted rewards.",
    participants: 8900,
    tasks: [],
  },
];

export const LEADERBOARD_DATA = {
  top3: [
    {
      rank: 2,
      name: "Brian Ngo",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      points: "50,000",
      prize: "500 USDT",
      color: "silver",
    },
    {
      rank: 1,
      name: "Jolie Joie",
      avatar:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
      points: "100,000",
      prize: "1,000 USDT",
      color: "gold",
    },
    {
      rank: 3,
      name: "David Do",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80",
      points: "20,000",
      prize: "200 USDT",
      color: "bronze",
    },
  ],
  list: [
    {
      rank: 4,
      name: "Henrietta O'Connell",
      handle: "@henrietta",
      followers: "12,241",
      points: "2,114,424",
      reward: "100 USDT",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 5,
      name: "Darrel Bins",
      handle: "@darrel",
      followers: "12,241",
      points: "2,114,424",
      reward: "100 USDT",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 6,
      name: "James Anderson",
      handle: "@janderson",
      followers: "10,000",
      points: "1,900,000",
      reward: "50 USDT",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 7,
      name: "Sarah Connor",
      handle: "@sconnor",
      followers: "9,500",
      points: "1,850,000",
      reward: "50 USDT",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 8,
      name: "Mike Ross",
      handle: "@mross",
      followers: "8,200",
      points: "1,700,000",
      reward: "25 USDT",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 9,
      name: "Jessica Pearson",
      handle: "@jpearson",
      followers: "7,800",
      points: "1,650,000",
      reward: "25 USDT",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
    },
    {
      rank: 10,
      name: "Harvey Specter",
      handle: "@hspecter",
      followers: "7,500",
      points: "1,600,000",
      reward: "25 USDT",
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80",
    },
  ],
};
