import Navbar from "@/components/landing-page/navbar";
import Hero from "@/components/landing-page/hero";
import TransformSection from "@/components/landing-page/transformation";
import Features from "@/components/landing-page/features";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <TransformSection />
      <Features />
    </main>
  );
}
