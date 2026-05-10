import React from 'react';
import { Card, Row, Col, Typography, Tag, Slider } from 'antd';
import NumberInput from './NumberInput';
import EnergyBlocks from './EnergyBlocks';
import { PLAYER_THEME, HP_SLIDER_CONFIG } from '../constants';
import type { PetState } from '../types';

const { Text } = Typography;

interface PetDetailCardProps {
  pet: PetState;
  petIndex: number;
  playerKey: string;
  playerNum: number;
  isActive: boolean;
  onSetActive: (playerKey: string, petName: string) => void;
  onUpdatePet: (playerKey: string, petIndex: number, field: string, value: number) => void;
}

const PetDetailCard: React.FC<PetDetailCardProps> = ({
  pet,
  petIndex,
  playerKey,
  playerNum,
  isActive,
  onSetActive,
  onUpdatePet,
}) => {
  const theme = PLAYER_THEME[playerNum];

  return (
    <Card
      key={pet.name}
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
          {isActive && (
            <Tag color={theme.tagColor} style={{ marginLeft: '8px' }}>
              当前
            </Tag>
          )}
        </div>
      }
      hoverable
      style={{
        marginBottom: '12px',
        background: isActive ? theme.bgColor : '#fff',
        borderLeft: isActive ? `4px solid ${theme.borderColor}` : '1px solid #d9d9d9',
        cursor: 'default',
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
            width={110}
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
            width={110}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default PetDetailCard;