import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Boxes, Printer, Sliders } from "lucide-react";
import GridfinityCalculator from "@/components/GridfinityCalculator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Gridfinity Calculator
          </h1>
          <nav>
            <Button variant="ghost" className="mr-4">
              About
            </Button>
            <Button variant="ghost" className="mr-4">
              Features
            </Button>
            <Button variant="ghost">Contact</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-20">
          <h2 className="text-5xl font-extrabold mb-6 text-gray-900">
            Design Your Perfect Storage Solution
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Effortlessly create custom Gridfinity layouts tailored to your
            workspace with our intuitive calculator.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">
              What is Gridfinity?
            </h3>
            <p className="text-gray-600 mb-6">
              Gridfinity is a revolutionary modular storage system designed to
              help you organize your workspace with maximum efficiency and
              flexibility. Our calculator empowers you to create custom
              Gridfinity layouts that perfectly fit your needs.
            </p>
            <Button variant="outline">Learn More</Button>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-white">
            <h3 className="text-2xl font-semibold mb-6">Key Features</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Calculator className="mr-4 h-6 w-6" />
                <span>Easy-to-use calculator interface</span>
              </li>
              <li className="flex items-center">
                <Boxes className="mr-4 h-6 w-6" />
                <span>Customizable grid dimensions</span>
              </li>
              <li className="flex items-center">
                <Sliders className="mr-4 h-6 w-6" />
                <span>Real-time visual preview</span>
              </li>
              <li className="flex items-center">
                <Printer className="mr-4 h-6 w-6" />
                <span>Export designs for 3D printing</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-20">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Enter Dimensions",
                description: "Specify your desired grid size",
              },
              {
                step: 2,
                title: "Customize Settings",
                description: "Adjust options for baseplates and bins",
              },
              {
                step: 3,
                title: "Preview Design",
                description: "View your layout in real-time",
              },
              {
                step: 4,
                title: "Export for Printing",
                description: "Get your design ready for 3D printing",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-lg shadow-md p-6 text-center"
              >
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Try the Calculator
          </h3>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <GridfinityCalculator />
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-4">
            Ready to optimize your workspace?
          </h3>
          <p className="text-gray-300 mb-8">
            Start designing your custom Gridfinity layout today!
          </p>
          <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
