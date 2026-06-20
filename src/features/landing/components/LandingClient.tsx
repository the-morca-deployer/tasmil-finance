"use client";
import Backdrop from "./Backdrop";
import Convergence from "./Convergence";
import Cta from "./Cta";
import Faq from "./Faq";
import Features from "./Features";
import Fees from "./Fees";
import Footer from "./Footer";
import Hero from "./Hero";
import Nav from "./Nav";
import Partners from "./Partners";
import Preloader from "./Preloader";
import Security from "./Security";
import Sidebar from "./Sidebar";
import Statement from "./Statement";
import StellarReel from "./StellarReel";
import { useLandingScripts } from "./useLandingScripts";

export default function LandingClient() {
  useLandingScripts();
  return (
    <div className="landing-page anim">
      <Preloader />
      <Backdrop />
      <Nav />
      <Sidebar />
      <Hero />
      <Partners />
      <StellarReel />
      <Statement />
      <Features />
      <Convergence />
      <Security />
      <Fees />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
