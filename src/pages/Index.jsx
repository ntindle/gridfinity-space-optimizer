import React from 'react';
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import GridfinityCalculator from '@/components/GridfinityCalculator';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <header className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Gridfinity Calculator</h1>
        <p className="text-xl text-gray-600 mb-8">Design your perfect storage solution with ease</p>
      </header>

      <main>
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What is Gridfinity?</h2>
          <p className="text-gray-700 mb-4">
            Gridfinity is a modular storage system designed to help you organize your workspace efficiently. 
            Our calculator helps you design custom Gridfinity layouts tailored to your needs.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Easy-to-use calculator interface</li>
              <li>Real-time visual preview</li>
              <li>Customizable grid dimensions</li>
              <li>Export designs for 3D printing</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <ol className="list-decimal list-inside text-gray-700">
              <li>Enter your desired grid dimensions</li>
              <li>Adjust settings for baseplates and bins</li>
              <li>View the real-time preview</li>
              <li>Export your design for printing</li>
            </ol>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Try the Calculator</h2>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <GridfinityCalculator />
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center">
        <p className="text-gray-600">Have questions or feedback?</p>
        <Button variant="outline" size="lg" className="mt-4">
          Contact Us
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
};

export default Index;