import React from 'react';
import { getColor, INCH_TO_MM } from '../utils/gridfinityUtils';

const GridfinityVisualPreview = ({ layout, drawerSize }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">Visual Preview:</h3>
      <div 
        style={{
          width: `${drawerSize.width * 20}px`,
          height: `${drawerSize.height * 20}px`,
          border: '2px solid #000',
          position: 'relative',
        }}
      >
        {layout.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${item.pixelX / INCH_TO_MM * 20}px`,
              top: `${item.pixelY / INCH_TO_MM * 20}px`,
              width: `${item.pixelWidth / INCH_TO_MM * 20}px`,
              height: `${item.pixelHeight / INCH_TO_MM * 20}px`,
              backgroundColor: getColor(item.type, index),
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            {item.type === 'baseplate' ? `${item.width}x${item.height}` : 
             item.type === 'half-size' ? `${item.width}x${item.height}` : 'Spacer'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridfinityVisualPreview;