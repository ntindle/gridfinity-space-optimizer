import React from 'react';
import { getColor, INCH_TO_MM } from '../utils/gridfinityUtils';

const GridfinityVisualPreview = ({ layout, drawerSize }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-4">Visual Preview:</h3>
      <div 
        style={{
          width: '100%',
          height: '0',
          paddingBottom: `${(drawerSize.height / drawerSize.width) * 100}%`,
          position: 'relative',
          border: '2px solid #000',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          {layout.map((item, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${(item.pixelX / INCH_TO_MM / drawerSize.width) * 100}%`,
                top: `${(item.pixelY / INCH_TO_MM / drawerSize.height) * 100}%`,
                width: `${(item.pixelWidth / INCH_TO_MM / drawerSize.width) * 100}%`,
                height: `${(item.pixelHeight / INCH_TO_MM / drawerSize.height) * 100}%`,
                backgroundColor: getColor(item.type, index),
                border: '1px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {item.type === 'baseplate' ? `${item.width}x${item.height}` : 
               item.type === 'half-size' ? `${item.width}x${item.height}` : 'Spacer'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridfinityVisualPreview;