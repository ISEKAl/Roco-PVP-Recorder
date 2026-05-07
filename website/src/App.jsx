import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Button, 
  Select, 
  InputNumber, 
  Form, 
  Row, 
  Col, 
  Divider,
  Typography,
  message,
  Space,
  Tag,
  Popconfirm,
  Tabs
} from 'antd';
import { 
  SaveOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import pokemonData from './config/pokemon.json';
import skillsData from './config/skills.json';
import buffsConfig from './config/buffs.json';

const { Title, Text } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;

const DEFAULT_PET_STATE = (name) => ({
  name,
  hp_ratio: 1,
  mp: 10
});

// 根据配置生成默认的增益减益对象
const DEFAULT_BUFF = () => {
  const buff = {};
  buffsConfig.forEach(b => {
    buff[b.key] = b.default;
  });
  return buff;
};

const App = () => {
  const [form] = Form.useForm();
  const [winner, setWinner] = useState(null);
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [rounds, setRounds] = useState([{
    cur_round: 1,
    player_1: {
      active_pet: '',
      pets: [],
      buff: DEFAULT_BUFF(),
      action: null
    },
    player_2: {
      active_pet: '',
      pets: [],
      buff: DEFAULT_BUFF(),
      action: null
    }
  }]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  const pokemonList = pokemonData.map(p => p.name);
  const skillList = skillsData.map(s => s.name);

  const handleTeamChange = (playerNum, team) => {
    const setTeam = playerNum === 1 ? setTeam1 : setTeam2;
    const playerKey = `player_${playerNum}`;
    
    setTeam(team);
    
    const newRounds = [...rounds];
    const round = newRounds[currentRoundIndex];
    
    if (round.cur_round === 1) {
      round[playerKey].pets = team.map(name => DEFAULT_PET_STATE(name));
    } else {
      const prevRound = newRounds[currentRoundIndex - 1];
      round[playerKey].pets = prevRound[playerKey].pets.map(p => ({...p}));
    }
    
    if (team.length > 0 && !round[playerKey].active_pet) {
      round[playerKey].active_pet = team[0];
    }
    
    setRounds(newRounds);
  };

  const addRound = () => {
    const prevRound = rounds[rounds.length - 1];
    const newRound = {
      cur_round: prevRound.cur_round + 1,
      player_1: {
        active_pet: prevRound.player_1.active_pet,
        pets: prevRound.player_1.pets.map(p => ({...p})),
        buff: {...prevRound.player_1.buff},
        action: null
      },
      player_2: {
        active_pet: prevRound.player_2.active_pet,
        pets: prevRound.player_2.pets.map(p => ({...p})),
        buff: {...prevRound.player_2.buff},
        action: null
      }
    };
    
    setRounds([...rounds, newRound]);
    setCurrentRoundIndex(rounds.length);
    message.success(`已添加第 ${newRound.cur_round} 回合`);
  };

  const deleteRound = () => {
    if (rounds.length <= 1) {
      message.warning('至少需要保留1回合');
      return;
    }
    
    const newRounds = rounds.slice(0, -1);
    setRounds(newRounds);
    setCurrentRoundIndex(newRounds.length - 1);
    message.success(`已删除第 ${rounds.length} 回合`);
  };

  const updatePetState = (playerKey, petIndex, field, value) => {
    const newRounds = [...rounds];
    const round = newRounds[currentRoundIndex];
    if (round[playerKey].pets[petIndex]) {
      round[playerKey].pets[petIndex][field] = value;
      setRounds(newRounds);
    }
  };

  const updateActivePet = (playerKey, petName) => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex][playerKey].active_pet = petName;
    setRounds(newRounds);
  };

  const updateBuff = (playerKey, field, value) => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex][playerKey].buff[field] = value;
    setRounds(newRounds);
  };

  const updateAction = (playerKey, action) => {
    const newRounds = [...rounds];
    newRounds[currentRoundIndex][playerKey].action = action;
    setRounds(newRounds);
  };

  const exportJSON = () => {
    if (!winner) {
      message.error('请选择胜利方');
      return;
    }
    
    if (team1.length === 0 || team2.length === 0) {
      message.error('请选择双方阵容');
      return;
    }

    const battleData = {
      time: new Date().toISOString(),
      winner,
      total_round: rounds.length,
      team_1: team1,
      team_2: team2,
      round: rounds.map(r => ({
        cur_round: r.cur_round,
        player_1: r.player_1,
        player_2: r.player_2
      }))
    };

    const blob = new Blob([JSON.stringify(battleData, null, 4)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('对局数据导出成功！');
  };

  const renderPlayerCard = (playerNum) => {
    const playerKey = `player_${playerNum}`;
    const team = playerNum === 1 ? team1 : team2;
    const round = rounds[currentRoundIndex];
    const playerState = round[playerKey];
    const bgColor = playerNum === 1 ? '#e6f7ff' : '#fff7e6';

    return (
      <Card type="inner" title={`玩家 ${playerNum}`} style={{ marginBottom: '16px' }}>
        <Form.Item label="场上精灵">
          <Select 
            value={playerState.active_pet}
            onChange={(val) => updateActivePet(playerKey, val)}
            style={{ width: '100%' }}
          >
            {team.map(name => <Option key={name} value={name}>{name}</Option>)}
          </Select>
        </Form.Item>

        <Divider orientation="left">精灵状态</Divider>
        {playerState.pets.map((pet, idx) => (
          <Card 
            key={pet.name}
            size="small" 
            title={pet.name} 
            style={{ 
              marginBottom: '8px', 
              background: pet.name === playerState.active_pet ? bgColor : '#fff',
              borderLeft: pet.name === playerState.active_pet ? '4px solid #1890ff' : '1px solid #d9d9d9'
            }}
          >
            <Space size="middle" wrap>
              <Text strong>HP:</Text>
              <InputNumber 
                min={0} 
                max={1} 
                step={0.05}
                precision={2}
                value={pet.hp_ratio}
                onChange={(val) => updatePetState(playerKey, idx, 'hp_ratio', val)}
              />
              <Text strong>能量:</Text>
              <InputNumber 
                min={0} 
                max={10}
                value={pet.mp}
                onChange={(val) => updatePetState(playerKey, idx, 'mp', val)}
              />
            </Space>
          </Card>
        ))}

        <Divider orientation="left">增益减益</Divider>
        <Space size="small" wrap>
          {buffsConfig.map(buffItem => (
            <React.Fragment key={buffItem.key}>
              <Text>{buffItem.label}:</Text>
              <InputNumber 
                min={buffItem.min}
                max={buffItem.max}
                value={playerState.buff[buffItem.key] ?? buffItem.default}
                onChange={(val) => updateBuff(playerKey, buffItem.key, val)}
              />
            </React.Fragment>
          ))}
        </Space>

        <Divider orientation="left">行动</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
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
              onChange={(name) => updateAction(playerKey, { ...playerState.action, skill_name: name })}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {skillList.map(name => <Option key={name} value={name}>{name}</Option>)}
            </Select>
          )}
          
          {playerState.action?.type === 'switch' && (
            <Select 
              placeholder="选择目标精灵"
              value={playerState.action.to}
              onChange={(to) => updateAction(playerKey, { ...playerState.action, to })}
              style={{ width: '100%' }}
            >
              {team.filter(name => name !== playerState.active_pet).map(name => 
                <Option key={name} value={name}>{name}</Option>
              )}
            </Select>
          )}
        </Space>
      </Card>
    );
  };

  const currentRound = rounds[currentRoundIndex];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ margin: 0, lineHeight: '64px' }}>
          🎮 洛克王国PVP对局录入系统
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Form form={form} layout="vertical">
          <Card title="📋 基本信息" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="胜利方">
                  <Select 
                    value={winner}
                    onChange={setWinner}
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
                  <Select 
                    mode="multiple" 
                    placeholder="选择最多6只精灵" 
                    maxCount={6}
                    value={team1}
                    onChange={(vals) => handleTeamChange(1, vals)}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {pokemonList.map(name => <Option key={name} value={name}>{name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="玩家2 阵容">
                  <Select 
                    mode="multiple" 
                    placeholder="选择最多6只精灵" 
                    maxCount={6}
                    value={team2}
                    onChange={(vals) => handleTeamChange(2, vals)}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {pokemonList.map(name => <Option key={name} value={name}>{name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card 
            title={
              <Space>
                <Text strong>🎯 第 {currentRound.cur_round} 回合</Text>
                <Tag color="blue">{currentRoundIndex + 1} / {rounds.length}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  disabled={currentRoundIndex === 0}
                  onClick={() => setCurrentRoundIndex(currentRoundIndex - 1)}
                >
                  上一回合
                </Button>
                <Button 
                  icon={<ArrowRightOutlined />}
                  disabled={currentRoundIndex === rounds.length - 1}
                  onClick={() => setCurrentRoundIndex(currentRoundIndex + 1)}
                >
                  下一回合
                </Button>
                <Popconfirm 
                  title="确定要删除这一回合吗？" 
                  onConfirm={deleteRound}
                >
                  <Button danger icon={<DeleteOutlined />}>删除回合</Button>
                </Popconfirm>
                <Button type="primary" icon={<PlusOutlined />} onClick={addRound}>
                  添加回合
                </Button>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <Row gutter={32}>
              <Col span={12}>
                {renderPlayerCard(1)}
              </Col>
              <Col span={12}>
                {renderPlayerCard(2)}
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<DownloadOutlined />} 
              onClick={exportJSON}
            >
              导出 JSON
            </Button>
          </div>
        </Form>
      </Content>
    </Layout>
  );
};

export default App;