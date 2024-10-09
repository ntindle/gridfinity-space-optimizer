import React from 'react';
import GridfinityCalculator from '../components/GridfinityCalculator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-3xl font-bold text-center">
              Gridfinity Space Optimizer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 mb-6">
              Optimize your drawer space with Gridfinity bins and baseplates
            </p>
            <GridfinityCalculator />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;