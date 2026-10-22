import React from "react";
import Header from "@/components/Header";
import GridfinityCalculator from "@/components/GridfinityCalculator";
import About from "@/components/About";
import AccessibilityStatement from "@/components/AccessibilityStatement";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <GridfinityCalculator />
        <About />
        <AccessibilityStatement />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
