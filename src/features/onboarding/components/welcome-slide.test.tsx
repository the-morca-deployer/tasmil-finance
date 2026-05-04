import { render, screen } from "@testing-library/react";
import { Bot } from "lucide-react";
import type { WelcomeSlideData } from "../config/welcome-slides-data";
import { WelcomeSlide } from "./welcome-slide";

const baseSlide: WelcomeSlideData = {
  icon: Bot,
  title: "Test slide",
  description: "Test body",
  gradient: "from-sky-500 to-blue-600",
};

describe("WelcomeSlide render branches", () => {
  it("renders the video slot when videoSrc is a non-empty string", () => {
    render(<WelcomeSlide slide={{ ...baseSlide, videoSrc: "/onboarding/intro.mp4" }} />);
    expect(screen.getByRole("button", { name: /play intro video/i })).toBeInTheDocument();
  });

  it("renders the image slot when imageSrc is set and videoSrc is absent", () => {
    render(
      <WelcomeSlide
        slide={{ ...baseSlide, imageSrc: "/onboarding/chat.png", imageAlt: "preview" }}
      />,
    );
    expect(screen.getByRole("img", { name: /preview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play intro video/i })).not.toBeInTheDocument();
  });

  it("renders only the icon block when neither video nor image is set", () => {
    render(<WelcomeSlide slide={baseSlide} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play intro video/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /test slide/i })).toBeInTheDocument();
  });

  it("treats empty string videoSrc/imageSrc as absent", () => {
    render(<WelcomeSlide slide={{ ...baseSlide, videoSrc: "", imageSrc: "" }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play intro video/i })).not.toBeInTheDocument();
  });
});
