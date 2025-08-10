import React from "react";
import GridfinityCalculator from "@/components/GridfinityCalculator";

const CalculatorSection = () => {
  return (
    <section className="mb-20">
      <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Try the Calculator
      </h3>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <GridfinityCalculator />
      </div>
    </section>
  );
};

export default CalculatorSection;