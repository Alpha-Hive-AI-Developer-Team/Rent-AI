import Navbar from "@/components/landing-page/navbar";
import Hero from "@/components/landing-page/hero";
import TransformSection from "@/components/landing-page/transformation";
import Features from "@/components/landing-page/features";
import WhyChooseRentAI from "@/components/landing-page/why-choose";
import GetStarted from "@/components/landing-page/get-started";
import PopularQueries from "@/components/landing-page/queries";
import Footer from "@/components/landing-page/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <TransformSection />
      <Features />
      <WhyChooseRentAI />
      <GetStarted />
      <PopularQueries />
      <Footer />
    </main>
  );
}
