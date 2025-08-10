import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CalculatorSection from "@/components/CalculatorSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <Hero />
        <Features />
        <HowItWorks />
        <CalculatorSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
