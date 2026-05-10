import React, { useState, useRef } from 'react';
import { Button, Card, Row, Col, Typography, Slider } from 'antd';
import NumberInput from './NumberInput';
import EnergyBlocks from './EnergyBlocks';
import { PLAYER_THEME, HP_SLIDER_CONFIG } from '../constants';
import type { PetState } from '../types';

const { Text } = Typography;

interface BenchPetButtonProps {
  pet: PetState;
  petIndex: number;
  playerKey: string;
  playerNum: number;
  onSetActive: (playerKey: string, petName: string) => void;
  onUpdatePet: (playerKey: string, petIndex: number, field: string, value: number) => void;
}

const BenchPetButton: React.FC<BenchPetButtonProps> = ({
  pet,
  petIndex,
  playerKey,
  playerNum,
  onSetActive,
  onUpdatePet,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const theme = PLAYER_THEME[playerNum];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={buttonRef}>
      <Button
        onClick={() => onSetActive(playerKey, pet.name)}
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        style={{
          marginRight: '8px',
          marginBottom: '8px',
          borderColor: theme.borderColor,
          color: theme.color,
        }}
      >
        {pet.name}
      </Button>

      {showPopup && (
        <div
          style={{
            position: 'absolute',
            top: '80%',
            left: '0',
            zIndex: 1000,
            paddingTop: '20px',
            paddingBottom: '20px',
          }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          <Card
            size="small"
            title={
              <div
                style={{
                  cursor: 'pointer',
                  margin: '-8px -16px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onClick={() => onSetActive(playerKey, pet.name)}
              >
                {pet.name}
              </div>
            }
            style={{
              width: '550px',
              borderLeft: `4px solid ${theme.borderColor}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Row gutter={8} align="middle" style={{ marginBottom: 12 }}>
              <Col span={3}>
                <Text strong type="secondary" style={{ fontSize: '13px' }}>HP</Text>
              </Col>
              <Col span={12}>
                <Slider
                  min={HP_SLIDER_CONFIG.min}
                  max={HP_SLIDER_CONFIG.max}
                  step={HP_SLIDER_CONFIG.step}
                  value={pet.hp_ratio}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
                  tooltip={{
                    formatter: (value) => (
                      <div style={{ fontSize: '18px', fontWeight: 'bold', padding: '4px 8px' }}>
                        {value}
                      </div>
                    ),
                  }}
                />
              </Col>
              <Col span={5}>
                <NumberInput
                  value={pet.hp_ratio}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
                  min={HP_SLIDER_CONFIG.min}
                  max={HP_SLIDER_CONFIG.max}
                  step={HP_SLIDER_CONFIG.step}
                  precision={2}
                  width={160}
                  showClear={false}
                  showStep10={false}
                />
              </Col>
            </Row>
            <Row gutter={8} align="middle">
              <Col span={3}>
                <Text strong type="secondary" style={{ fontSize: '13px' }}>能量</Text>
              </Col>
              <Col span={12}>
                <EnergyBlocks
                  value={pet.mp}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'mp', val)}
                  playerNum={playerNum}
                />
              </Col>
              <Col span={5}>
                <NumberInput
                  value={pet.mp}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'mp', val)}
                  min={0}
                  max={10}
                  width={160}
                  showClear={false}
                  showStep10={false}
                />
              </Col>
            </Row>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BenchPetButton;