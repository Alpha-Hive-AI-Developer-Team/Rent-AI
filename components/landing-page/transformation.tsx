"use client";

export default function TransformSection() {
  return (
    <section
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] flex items-end text-white overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero.png')", // replace with your bg image
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Bottom-left Text */}
      <div className="relative z-10 px-6 sm:px-16 pb-10 text-left">
        <h2 className="text-3xl text-[#CBCBCB] sm:text-xl md:text-4xl leading-relaxed max-w-lg">
          Transforming Rent Management <br /> through AI and Automation.
        </h2>
      </div>
    </section>
  );
}
