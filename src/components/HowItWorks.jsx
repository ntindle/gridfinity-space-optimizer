import React from "react";

const HowItWorks = () => {
  const steps = [
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
  ];

  return (
    <section className="mb-20">
      <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">
        How It Works
      </h3>
      <div className="grid md:grid-cols-4 gap-8">
        {steps.map((item) => (
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
  );
};

export default HowItWorks;