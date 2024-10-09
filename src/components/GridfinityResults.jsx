import React from 'react';

const GridfinityResults = ({ result, useHalfSize, preferHalfSize }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Results</h3>
      {!useHalfSize && (
        <div>
          <h4 className="text-lg font-medium">Baseplates:</h4>
          <ul className="list-disc list-inside pl-4">
            {Object.entries(result.baseplates).map(([size, count]) => (
              <li key={size} className="text-gray-700">{count} {size} baseplate(s)</li>
            ))}
          </ul>
        </div>
      )}
      {(useHalfSize || preferHalfSize) && result.halfSizeBins && (
        <div>
          <h4 className="text-lg font-medium">Half-size Bins:</h4>
          <ul className="list-disc list-inside pl-4">
            {Object.entries(result.halfSizeBins).map(([size, count]) => (
              <li key={size} className="text-gray-700">{count} {size} half-size bin(s)</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h4 className="text-lg font-medium">Spacers:</h4>
        <ul className="list-disc list-inside pl-4">
          {Object.entries(result.spacers).map(([size, count]) => (
            <li key={size} className="text-gray-700">{count} spacer(s): {size}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GridfinityResults;