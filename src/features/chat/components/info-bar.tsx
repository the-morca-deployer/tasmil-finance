interface InfoBarProps {
  currentApy: number;
  marketApy: number;
}

export function InfoBar({ currentApy, marketApy }: InfoBarProps) {
  return (
    <div className="w-full border-b border-white/[0.06] bg-[#0d1410] px-4 py-2 text-center text-sm text-[#9aada4]">
      You can earn <span className="font-semibold text-[#00C278]">{currentApy}% APY on Tasmil</span>{" "}
      vs. market average of {marketApy}%
    </div>
  );
}
