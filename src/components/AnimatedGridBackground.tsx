import React, { useEffect, useRef, useState } from 'react';

export const AnimatedGridBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  
  // 40px tile as requested + 1px gap means 41px effective cell size.
  const TILE_SIZE = 40; 
  const GAP_SIZE = 1;
  const CELL_SIZE = TILE_SIZE + GAP_SIZE;

  useEffect(() => {
    const updateGrid = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Calculate enough columns and rows to cover the container. Add 1 to ensure edges are fully covered.
      const cols = Math.ceil(width / CELL_SIZE) + 1;
      const rows = Math.ceil(height / CELL_SIZE) + 1;
      
      setDimensions({ cols, rows });
    };

    updateGrid();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateGrid);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [CELL_SIZE]);

  const { cols, rows } = dimensions;

  // Don't render tiles until we have measured
  if (cols === 0 || rows === 0) {
    return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
  }

  // Pre-generate grid coordinates
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({ row: r, col: c });
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ 
        perspective: '1200px', 
        opacity: 0.15 
      }}
    >
      <div 
        className="w-full h-full grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${rows}, ${TILE_SIZE}px)`,
          gap: `${GAP_SIZE}px`,
          // Center the grid if it's slightly larger than the container to prevent uneven edges
          justifyContent: 'center',
          alignContent: 'center',
        }}
      >
        {tiles.map((tile) => {
          // Wave travels LEFT -> RIGHT (driven primarily by column).
          // Slight row variance creates a more organic, diagonal-leaning fluid motion instead of rigid columns.
          const delay = tile.col * 0.12 + tile.row * 0.05; 
          
          return (
            <div
              key={`${tile.row}-${tile.col}`}
              className="tile-flip-animated"
              style={{
                backgroundImage: "url('/grid.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                animationDelay: `${delay}s`,
                transformStyle: 'preserve-3d',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
