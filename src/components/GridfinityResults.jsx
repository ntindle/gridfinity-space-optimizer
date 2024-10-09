import React from 'react';

const GridfinityResults = ({ result, useHalfSize, preferHalfSize }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">Result:</h3>
      <h4 className="text-md font-semibold mt-2">Baseplates:</h4>
      <ul className="list-disc list-inside">
        {Object.entries(result.baseplates).map(([size, count]) => (
          <li key={size}>{count} {size} baseplate(s)</li>
        ))}
      </ul>
      {(useHalfSize || preferHalfSize) && result.halfSizeBins > 0 && (
        <>
          <h4 className="text-md font-semibold mt-2">Half-size Bins:</h4>
          <p>{result.halfSizeBins} half-size bin(s)</p>
        </>
      )}
      <h4 className="text-md font-semibold mt-2">Spacers:</h4>
      <ul className="list-disc list-inside">
        {Object.entries(result.spacers).map(([size, count]) => (
          <li key={size}>{count} spacer(s): {size}</li>
        ))}
      </ul>
    </div>
  );
};

export default GridfinityResults;