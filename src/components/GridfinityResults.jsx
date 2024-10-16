import React from "react";

const GridfinityResults = ({ result, useHalfSize, preferHalfSize }) => {
  const { baseplates, halfSizeBins, spacers, numDrawers } = result;

  const multiplyQuantities = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, value * numDrawers])
    );
  };

  const totalBaseplates = multiplyQuantities(baseplates);
  const totalHalfSizeBins = halfSizeBins
    ? multiplyQuantities(halfSizeBins)
    : null;
  const totalSpacers = multiplyQuantities(spacers);

  return (
      <div className="space-y-4">
        <h4 className="text-xl font-semibold">
          Results for {numDrawers} drawer{numDrawers > 1 ? "s" : ""}
        </h4>
        {!useHalfSize && (
          <div>
            <h5 className="text-lg font-medium">Baseplates:</h5>
            <ul className="list-disc list-inside pl-4">
              {Object.entries(totalBaseplates).map(([size, count]) => (
                <li key={size} className="text-gray-700">
                  {count} {size} baseplate(s)
                </li>
              ))}
            </ul>
          </div>
        )}
        {(useHalfSize || preferHalfSize) && totalHalfSizeBins && (
          <div>
            <h5 className="text-lg font-medium">Half-size Bins:</h5>
            <ul className="list-disc list-inside pl-4">
              {Object.entries(totalHalfSizeBins).map(([size, count]) => (
                <li key={size} className="text-gray-700">
                  {count} {size} half-size bin(s)
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h5 className="text-lg font-medium">Spacers:</h5>
          <ul className="list-disc list-inside pl-4">
            {Object.entries(totalSpacers).map(([size, count]) => (
              <li key={size} className="text-gray-700">
                {count} spacer(s): {size}
              </li>
            ))}
          </ul>
        </div>
      </div>
  );
};

export default GridfinityResults;
