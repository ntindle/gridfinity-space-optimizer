import React from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
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
  );
};

export default Header;