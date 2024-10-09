import React from 'react';
import GridfinityCalculator from '../components/GridfinityCalculator';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Gridfinity Space Calculator</h1>
        <GridfinityCalculator />
      </div>
    </div>
  );
};

export default Index;