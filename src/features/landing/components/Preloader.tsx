export default function Preloader() {
  return (
    <>
      <div
        id="preload"
        className={[
          /* base layout */
          "fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-[26px]",
          /* background */
          "bg-[#000000]",
          /* fade transition */
          "transition-[opacity,visibility] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          /* done state */
          "data-[done=true]:opacity-0 data-[done=true]:invisible data-[done=true]:pointer-events-none",
        ].join(" ")}
      >
        {/* logo */}
        <div className="relative w-[118px] h-[118px] animate-pl-float motion-reduce:animate-none">
          <img
            src="/tasmil-logo.png"
            alt="Tasmil Finance"
            width={118}
            height={118}
            className="w-full h-full object-contain"
          />
        </div>

        {/* wordmark */}
        <div className="relative text-[40px] font-bold tracking-[-0.035em]">
          <b
            className={[
              "font-bold bg-clip-text text-transparent",
              "bg-[linear-gradient(100deg,#fff_0%,#67e8f9_100%)]",
            ].join(" ")}
          >
            Tasmil
          </b>{" "}
          <i
            className={[
              "not-italic bg-clip-text text-transparent",
              "bg-[linear-gradient(110deg,#fff_0%,#67e8f9_55%,#0ea5e9_100%)]",
            ].join(" ")}
          >
            Finance
          </i>
        </div>

        {/* progress bar */}
        <div className="relative w-[168px] h-[3px] rounded-[3px] bg-white/[0.08] overflow-hidden">
          <div
            className={[
              "absolute top-0 left-0 h-full w-[40%] rounded-[3px]",
              "bg-[linear-gradient(110deg,#fff_0%,#67e8f9_55%,#0ea5e9_100%)]",
              "animate-pl-bar motion-reduce:animate-none",
            ].join(" ")}
          />
        </div>
      </div>
    </>
  );
}
