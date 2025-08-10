import React from "react";
import { Button } from "@/components/ui/button";
import { Github, Heart, FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-2xl font-semibold mb-4">Gridfinity Calculator</h3>
        <p className="text-gray-300 mb-8">
          An open-source project to help you design custom Gridfinity layouts.
        </p>
        <div className="flex flex-col sm:flex-row justify-center sm:space-x-4 space-y-4 sm:space-y-0 mb-8">
          <Button
            variant="secondary"
            size="lg"
            className="text-lg px-6 py-4 w-full sm:w-auto"
            onClick={() =>
              window.open(
                "https://github.com/ntindle/gridfinity-space-optimizer",
                "_blank"
              )
            }
          >
            <Github className="mr-2 h-5 w-5" />
            GitHub
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="text-lg px-6 py-4 w-full sm:w-auto"
            onClick={() =>
              window.open("https://github.com/sponsors/ntindle", "_blank")
            }
          >
            <Heart className="mr-2 h-5 w-5" />
            Donate
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="text-lg px-6 py-4 w-full sm:w-auto"
            onClick={() =>
              window.open(
                "https://github.com/ntindle/gridfinity-space-optimizer/blob/main/LICENSE",
                "_blank"
              )
            }
          >
            <FileText className="mr-2 h-5 w-5" />
            License
          </Button>
        </div>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Gridfinity Calculator. Licensed under
          MIT.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
