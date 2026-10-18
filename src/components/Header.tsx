import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { GithubIcon } from "@/components/icons";

const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-xs">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Gridfinity Layout
        </h1>
        <nav>
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() =>
              window.open(
                "https://github.com/ntindle/gridfinity-space-optimizer",
                "_blank"
              )
            }
          >
            <GithubIcon className="mr-2 h-5 w-5" />
            GitHub
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              window.open("https://github.com/sponsors/ntindle", "_blank")
            }
          >
            <Heart className="mr-2 h-5 w-5" />
            Donate
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
