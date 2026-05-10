import React from 'react';
import { Card, Form, Select, Button, Row, Col, Typography, Space } from 'antd';
import PetDetailCard from './PetDetailCard';
import BenchPetButton from './BenchPetButton';
import NumberInput from './NumberInput';
import { PLAYER_THEME } from '../constants';
import buffsConfig from '../config/buffs.json';
import { useBattleStore } from '../stores/battleStore';
import type { Action, BuffConfigItem } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface PlayerPanelProps {
  playerNum: number;
  skillList: string[];
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  playerNum,
  skillList,
}) => {
  const playerKey = `player_${playerNum}`;
  const theme = PLAYER_THEME[playerNum];

  const team = useBattleStore((s) => playerNum === 1 ? s.team1 : s.team2);
  const playerState = useBattleStore(
    (s) => s.rounds[s.currentRoundIndex][playerKey as 'player_1' | 'player_2']
  );
  const updateActivePet = useBattleStore((s) => s.updateActivePet);
  const updatePetState = useBattleStore((s) => s.updatePetState);
  const updateBuff = useBattleStore((s) => s.updateBuff);
  const clearAllBuffs = useBattleStore((s) => s.clearAllBuffs);
  const updateAction = useBattleStore((s) => s.updateAction);

  return (
    <Card
      type="inner"
      title={<Text strong style={{ fontSize: '15px', color: theme.borderColor }}>玩家 {playerNum}</Text>}
      style={{
        marginBottom: '16px',
        borderTop: `3px solid ${theme.borderColor}`,
      }}
    >
      {/* 场上精灵选择 */}
      <Form.Item label={<Text strong style={{ fontSize: '13px' }}>场上精灵</Text>} style={{ marginBottom: 12 }}>
        <Select
          value={playerState.active_pet}
          onChange={(val) => updateActivePet(playerKey, val)}
          style={{ width: '100%' }}
        >
          {team.map((name) => <Option key={name} value={name}>{name}</Option>)}
        </Select>
      </Form.Item>

      {/* 精灵状态区域 */}
      <div style={{ marginBottom: 16, fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>
        <Text strong style={{ fontSize: '13px' }}>精灵状态</Text>
      </div>

      {/* 在场精灵 - 完整卡片 */}
      {playerState.pets
        .filter((pet) => pet.name === playerState.active_pet)
        .map((pet) => {
          const originalIndex = playerState.pets.findIndex((p) => p.name === pet.name);
          return (
            <PetDetailCard
              key={pet.name}
              pet={pet}
              petIndex={originalIndex}
              playerKey={playerKey}
              playerNum={playerNum}
              isActive={true}
              onSetActive={updateActivePet}
              onUpdatePet={updatePetState}
            />
          );
        })}

      {/* 替补精灵 - 排成一排的按钮 */}
      {playerState.pets.filter((pet) => pet.name !== playerState.active_pet).length > 0 && (
        <>
          <div style={{ marginBottom: 16, fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>
            <Text strong style={{ fontSize: '13px' }}>替补精灵</Text>
          </div>
          <div style={{ marginBottom: '8px' }}>
            {playerState.pets
              .filter((pet) => pet.name !== playerState.active_pet)
              .map((pet) => {
                const originalIndex = playerState.pets.findIndex((p) => p.name === pet.name);
                return (
                  <BenchPetButton
                    key={pet.name}
                    pet={pet}
                    petIndex={originalIndex}
                    playerKey={playerKey}
                    playerNum={playerNum}
                    onSetActive={updateActivePet}
                    onUpdatePet={updatePetState}
                  />
                );
              })}
          </div>
        </>
      )}

      {/* 增益减益区域 */}
      <div style={{ marginBottom: 16, fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>
        <Space>
          <Text strong style={{ fontSize: '13px' }}>增益减益</Text>
          <Button danger onClick={() => clearAllBuffs(playerKey)}>
            全部清空
          </Button>
        </Space>
      </div>
      <Row gutter={[16, 12]}>
        {(buffsConfig as BuffConfigItem[]).map((buffItem) => (
          <Col span={12} key={buffItem.key}>
            <Space align="center">
              <Text style={{ width: '60px', textAlign: 'right', fontWeight: 500, fontSize: '13px' }}>
                {buffItem.label}
              </Text>
              <NumberInput
                min={buffItem.min}
                max={buffItem.max}
                value={playerState.buff[buffItem.key] ?? buffItem.default}
                onChange={(val) => updateBuff(playerKey, buffItem.key, val)}
                width={320}
                showClear={true}
                showStep10={true}
              />
            </Space>
          </Col>
        ))}
      </Row>

      {/* 行动选择区域 */}
      <div style={{ marginBottom: 16, fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>
        <Text strong style={{ fontSize: '13px' }}>行动</Text>
      </div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Select
          placeholder="选择行动类型"
          value={playerState.action?.type}
          onChange={(type) => updateAction(playerKey, { type, skill_name: null, to: null })}
          style={{ width: '100%' }}
        >
          <Option value="skill">使用技能</Option>
          <Option value="switch">更换精灵</Option>
        </Select>

        {playerState.action?.type === 'skill' && (
          <Select
            placeholder="选择技能"
            value={playerState.action.skill_name}
            onChange={(name) => updateAction(playerKey, { ...playerState.action, skill_name: name } as Action)}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => {
              const label = option?.children;
              if (typeof label !== 'string') return false;
              return String(label).toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {skillList.map((name) => <Option key={name} value={name}>{name}</Option>)}
          </Select>
        )}

        {playerState.action?.type === 'switch' && (
          <Select
            placeholder="选择目标精灵"
            value={playerState.action.to}
            onChange={(to) => updateAction(playerKey, { ...playerState.action, to } as Action)}
            style={{ width: '100%' }}
          >
            {team
              .filter((name) => name !== playerState.active_pet)
              .map((name) => <Option key={name} value={name}>{name}</Option>)}
          </Select>
        )}
      </Space>
    </Card>
  );
};

export default PlayerPanel;
