import React from 'react';
import { Card, Form, Row, Col, Select, Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { MAX_TEAM_SIZE } from '../constants';

const { Option } = Select;

interface BasicInfoProps {
  winner: number | null;
  onWinnerChange: (value: number) => void;
  team1: string[];
  team2: string[];
  onTeamChange: (playerNum: number, team: string[]) => void;
  pokemonList: string[];
  onExport: () => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  winner,
  onWinnerChange,
  team1,
  team2,
  onTeamChange,
  pokemonList,
  onExport,
}) => {
  return (
    <Card
      title="基本信息"
      extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={onExport}>
          导出 JSON
        </Button>
      }
      style={{ marginBottom: '16px' }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="胜利方">
            <Select
              value={winner}
              onChange={onWinnerChange}
              placeholder="请选择胜利方"
            >
              <Option value={1}>玩家 1 胜</Option>
              <Option value={2}>玩家 2 胜</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="玩家1 阵容">
            <Space.Compact style={{ width: '100%' }}>
              <Select
                mode="multiple"
                placeholder="选择最多6只精灵"
                maxCount={MAX_TEAM_SIZE}
                value={team1}
                onChange={(vals) => onTeamChange(1, vals)}
                showSearch
                filterOption={(input, option) => {
                  const label = option?.children;
                  if (typeof label !== 'string') return false;
                  return String(label).toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
                style={{ flex: 1 }}
              >
                {pokemonList.map((name) => <Option key={name} value={name}>{name}</Option>)}
              </Select>
              <Button
                danger
                onClick={() => onTeamChange(1, [])}
                disabled={team1.length === 0}
              >
                一键清空
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="玩家2 阵容">
            <Space.Compact style={{ width: '100%' }}>
              <Select
                mode="multiple"
                placeholder="选择最多6只精灵"
                maxCount={MAX_TEAM_SIZE}
                value={team2}
                onChange={(vals) => onTeamChange(2, vals)}
                showSearch
                filterOption={(input, option) => {
                  const label = option?.children;
                  if (typeof label !== 'string') return false;
                  return String(label).toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
                style={{ flex: 1 }}
              >
                {pokemonList.map((name) => <Option key={name} value={name}>{name}</Option>)}
              </Select>
              <Button
                danger
                onClick={() => onTeamChange(2, [])}
                disabled={team2.length === 0}
              >
                一键清空
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default BasicInfo;