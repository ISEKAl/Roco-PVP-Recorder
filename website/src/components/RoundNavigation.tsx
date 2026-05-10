import React from 'react';
import { Card, Button, Row, Col, Tabs, Space, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import PlayerPanel from './PlayerPanel';
import { useBattleStore } from '../stores/battleStore';

interface RoundNavigationProps {
  skillList: string[];
  onAddRound: () => void;
  onDeleteRound: () => void;
  onDeleteAllRounds: () => void;
}

const RoundNavigation: React.FC<RoundNavigationProps> = ({
  skillList,
  onAddRound,
  onDeleteRound,
  onDeleteAllRounds,
}) => {
  const rounds = useBattleStore((s) => s.rounds);
  const currentRoundIndex = useBattleStore((s) => s.currentRoundIndex);
  const navigateRound = useBattleStore((s) => s.navigateRound);

  return (
    <Card
      title="回合详情"
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            disabled={currentRoundIndex === 0}
            onClick={() => navigateRound(currentRoundIndex - 1)}
          >
            上一回合
          </Button>
          <Button
            icon={<ArrowRightOutlined />}
            disabled={currentRoundIndex === rounds.length - 1}
            onClick={() => navigateRound(currentRoundIndex + 1)}
          >
            下一回合
          </Button>
          <Popconfirm
            title="确定要删除这一回合吗？"
            onConfirm={onDeleteRound}
          >
            <Button danger icon={<DeleteOutlined />}>删除回合</Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除全部回合并重置吗？"
            description="此操作不可撤销，所有回合数据将丢失"
            onConfirm={onDeleteAllRounds}
          >
            <Button danger icon={<DeleteOutlined />}>删除全部回合</Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddRound}>
            添加回合
          </Button>
        </Space>
      }
      style={{ marginBottom: '16px' }}
    >
      <Tabs
        activeKey={String(currentRoundIndex)}
        onChange={(key) => navigateRound(Number(key))}
        type="card"
        size="small"
        items={rounds.map((round, idx) => ({
          key: String(idx),
          label: `第 ${round.cur_round} 回合`,
        }))}
        style={{ marginBottom: '16px' }}
      />
      <Row gutter={32}>
        <Col span={12}>
          <PlayerPanel
            playerNum={1}
            skillList={skillList}
          />
        </Col>
        <Col span={12}>
          <PlayerPanel
            playerNum={2}
            skillList={skillList}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default RoundNavigation;
