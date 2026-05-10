import React, { useState, useRef, useCallback } from 'react';
import { Tooltip } from 'antd';
import { PLAYER_THEME, ENERGY_BLOCK_COUNT, ENERGY_BLOCK_WIDTH } from '../constants';

interface EnergyBlocksProps {
  value: number;
  onChange: (value: number) => void;
  playerNum: number;
}

const EnergyBlocks: React.FC<EnergyBlocksProps> = ({ value, onChange, playerNum }) => {
  const [hoverMp, setHoverMp] = useState<number | null>(null);
  const [isContainerHovered, setIsContainerHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = PLAYER_THEME[playerNum];

  const getBlockIndex = useCallback((clientX: number): number => {
    const container = containerRef.current;
    if (!container) return -1;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    if (x >= 0 && x <= ENERGY_BLOCK_COUNT * ENERGY_BLOCK_WIDTH) {
      return Math.min(Math.floor(x / ENERGY_BLOCK_WIDTH), ENERGY_BLOCK_COUNT - 1);
    }
    return -1;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const index = getBlockIndex(e.clientX);
    setHoverMp(index >= 0 ? index : null);
  }, [getBlockIndex]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const index = getBlockIndex(e.clientX);
    if (index >= 0) {
      onChange(index + 1);
    }
  }, [getBlockIndex, onChange]);

  const handleDoubleClick = useCallback(() => {
    onChange(0);
  }, [onChange]);

  const containerWidth = ENERGY_BLOCK_COUNT * ENERGY_BLOCK_WIDTH;

  return (
    <Tooltip
      title={
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            单击选择能量值
          </div>
          <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
            双击可设置能量为零
          </div>
        </div>
      }
      open={isContainerHovered && hoverMp === null}
    >
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 0',
          width: `${containerWidth}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsContainerHovered(true)}
        onMouseLeave={() => {
          setIsContainerHovered(false);
          setHoverMp(null);
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {[...Array(ENERGY_BLOCK_COUNT)].map((_, i) => {
          const isActive = i < value;
          const isHovered = hoverMp !== null && i <= hoverMp;
          return (
            <div
              key={i}
              style={{
                width: `${ENERGY_BLOCK_WIDTH}px`,
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Tooltip
                title={
                  <div style={{ fontSize: '18px', fontWeight: 'bold', padding: '4px 8px' }}>
                    {i + 1}
                  </div>
                }
                open={hoverMp === i}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    backgroundColor: isHovered
                      ? theme.hoverBgColor
                      : (isActive
                          ? theme.color
                          : '#fff'),
                    transition: 'background-color 0.1s',
                  }}
                />
              </Tooltip>
            </div>
          );
        })}
      </div>
    </Tooltip>
  );
};

export default EnergyBlocks;