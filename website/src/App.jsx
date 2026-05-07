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
  Tabs,
  Slider,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  MinusOutlined
} from '@ant-design/icons';
import pokemonData from './config/pokemon.json';
import skillsData from './config/skills.json';
import buffsConfig from './config/buffs.json';

const { Title, Text } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;

const PetDetailCard = ({ 
  pet, 
  petIndex,
  playerKey, 
  playerNum, 
  isActive, 
  onSetActive, 
  onUpdatePet, 
  bgColor, 
  borderColor 
}) => {
  return (
    <Card 
      key={pet.name}
      size="small" 
      title={
        <div 
          style={{ 
            cursor: 'pointer',
            margin: '-8px -16px',
            padding: '8px 16px'
          }}
          onClick={() => onSetActive(playerKey, pet.name)}
        >
          {pet.name}
          {isActive && (
            <Tag color={playerNum === 1 ? 'blue' : 'orange'} style={{ marginLeft: '8px', fontSize: '12px' }}>
              当前
            </Tag>
          )}
        </div>
      }
      hoverable
      style={{ 
        marginBottom: '12px', 
        background: isActive ? bgColor : '#fff',
        borderLeft: isActive ? `4px solid ${borderColor}` : '1px solid #d9d9d9',
        cursor: 'default'
      }}
    >
      <Row gutter={8} align="middle" style={{ marginBottom: 12 }}>
        <Col span={3}>
          <Text strong>HP:</Text>
        </Col>
        <Col span={12}>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={pet.hp_ratio}
            onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
            tooltip={{
              formatter: (value) => (
                <div style={{ fontSize: '18px', fontWeight: 'bold', padding: '4px 8px' }}>
                  {value}
                </div>
              )
            }}
          />
        </Col>
        <Col span={5}>
          <NumberInput
            value={pet.hp_ratio}
            onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
            min={0}
            max={1}
            step={0.05}
            precision={2}
            width={110}
          />
        </Col>
      </Row>
      <Row gutter={8} align="middle">
        <Col span={3}>
          <Text strong>能量:</Text>
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

const BenchPetButton = ({ 
  pet, 
  petIndex, 
  playerKey, 
  playerNum, 
  onSetActive, 
  onUpdatePet, 
  bgColor, 
  borderColor 
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const buttonRef = React.useRef(null);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={buttonRef}>
      <Button
        onClick={() => onSetActive(playerKey, pet.name)}
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        style={{ 
          marginRight: '8px', 
          marginBottom: '8px',
          borderColor: borderColor,
          color: playerNum === 1 ? '#1890ff' : '#fa8c16'
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
            paddingBottom: '20px'
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
                  padding: '8px 16px'
                }}
                onClick={() => onSetActive(playerKey, pet.name)}
              >
                {pet.name}
              </div>
            }
            style={{ 
              width: '550px',
              borderLeft: `4px solid ${borderColor}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Row gutter={8} align="middle" style={{ marginBottom: 12 }}>
              <Col span={3}>
                <Text strong>HP:</Text>
              </Col>
              <Col span={12}>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={pet.hp_ratio}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
                  tooltip={{
                    formatter: (value) => (
                      <div style={{ fontSize: '18px', fontWeight: 'bold', padding: '4px 8px' }}>
                        {value}
                      </div>
                    )
                  }}
                />
              </Col>
              <Col span={5}>
                <NumberInput
                  value={pet.hp_ratio}
                  onChange={(val) => onUpdatePet(playerKey, petIndex, 'hp_ratio', val)}
                  min={0}
                  max={1}
                  step={0.05}
                  precision={2}
                  width={110}
                />
              </Col>
            </Row>
            <Row gutter={8} align="middle">
              <Col span={3}>
                <Text strong>能量:</Text>
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
        </div>
      )}
    </div>
  );
};

const NumberInput = ({ value, onChange, min = 0, max = 100, step = 1, precision, width = 120 }) => {
  const displayValue = precision !== undefined ? value.toFixed(precision) : value;
  
  return (
    <div style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      overflow: 'hidden',
      width: width
    }}>
      <Button 
        type="text"
        icon={<MinusOutlined />} 
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        style={{ 
          border: 'none', 
          borderRadius: 0, 
          borderRight: '1px solid #d9d9d9',
          height: '32px',
          width: '36px'
        }}
      />
      <div style={{ 
        flex: 1,
        textAlign: 'center', 
        fontSize: '15px', 
        fontWeight: 'bold',
        lineHeight: '32px',
        background: '#fff'
      }}>
        {displayValue}
      </div>
      <Button 
        type="text"
        icon={<PlusOutlined />} 
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        style={{ 
          border: 'none', 
          borderRadius: 0, 
          borderLeft: '1px solid #d9d9d9',
          height: '32px',
          width: '36px'
        }}
      />
    </div>
  );
};

const EnergyBlocks = ({ value, onChange, playerNum }) => {
  const [hoverMp, setHoverMp] = useState(null);
  const containerRef = React.useRef(null);
  
  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const blockWidth = 24;
    let index = Math.min(Math.floor(x / blockWidth), 9);
    
    // 检查是否在容器内
    if (x >= 0 && x <= 10 * blockWidth) {
      setHoverMp(index);
    } else {
      setHoverMp(null);
    }
  };
  
  const handleClick = (e) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const blockWidth = 24;
    const index = Math.min(Math.floor(x / blockWidth), 9);
    onChange(index + 1);
  };
  
  const handleDoubleClick = () => {
    onChange(0);
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '2px 0',
        width: '240px'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverMp(null)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {[...Array(10)].map((_, i) => {
        const isActive = i < value;
        const isHovered = hoverMp !== null && i <= hoverMp;
        return (
          <div
            key={i}
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
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
                    ? (playerNum === 1 ? '#91caff' : '#ffd591')
                    : (isActive 
                        ? (playerNum === 1 ? '#1890ff' : '#fa8c16') 
                        : '#fff'),
                  transition: 'background-color 0.1s'
                }}
              />
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

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
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    a.download = `battle_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;
    
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
    const borderColor = playerNum === 1 ? '#1890ff' : '#fa8c16';

    return (
      <Card 
        type="inner" 
        title={`玩家 ${playerNum}`} 
        style={{ 
          marginBottom: '16px',
          borderTop: `3px solid ${borderColor}`
        }}
      >
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
        
        {/* 在场精灵 - 完整卡片 */}
        {playerState.pets.filter(pet => pet.name === playerState.active_pet).map((pet, idx) => {
          const originalIndex = playerState.pets.findIndex(p => p.name === pet.name);
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
              bgColor={bgColor}
              borderColor={borderColor}
            />
          );
        })}
        
        {/* 替补精灵 - 排成一排的按钮 */}
        {playerState.pets.filter(pet => pet.name !== playerState.active_pet).length > 0 && (
          <>
            <Divider orientation="left" style={{ fontSize: '13px', margin: '12px 0' }}>替补精灵</Divider>
            <div style={{ marginBottom: '8px' }}>
              {playerState.pets.filter(pet => pet.name !== playerState.active_pet).map((pet, idx) => {
                const originalIndex = playerState.pets.findIndex(p => p.name === pet.name);
                return (
                  <BenchPetButton
                    key={pet.name}
                    pet={pet}
                    petIndex={originalIndex}
                    playerKey={playerKey}
                    playerNum={playerNum}
                    onSetActive={updateActivePet}
                    onUpdatePet={updatePetState}
                    bgColor={bgColor}
                    borderColor={borderColor}
                  />
                );
              })}
            </div>
          </>
        )}

        <Divider orientation="left">增益减益</Divider>
        <Row gutter={[12, 8]}>
          {buffsConfig.map(buffItem => (
            <Col span={12} key={buffItem.key}>
              <Space>
                <Text>{buffItem.label}:</Text>
                <NumberInput 
                  min={buffItem.min}
                  max={buffItem.max}
                  value={playerState.buff[buffItem.key] ?? buffItem.default}
                  onChange={(val) => updateBuff(playerKey, buffItem.key, val)}
                  width={120}
                />
              </Space>
            </Col>
          ))}
        </Row>

        <Divider orientation="left">行动</Divider>
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
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Title level={3} style={{ margin: 0, lineHeight: '64px' }}>
          🎮 洛克王国PVP对局录入工具
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Form form={form} layout="vertical">
          <Card 
            title="📋 基本信息" 
            extra={
              <Button type="primary" icon={<DownloadOutlined />} onClick={exportJSON}>
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
            title="🎯 回合详情"
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
            <Tabs 
              activeKey={String(currentRoundIndex)} 
              onChange={(key) => setCurrentRoundIndex(Number(key))}
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
                {renderPlayerCard(1)}
              </Col>
              <Col span={12}>
                {renderPlayerCard(2)}
              </Col>
            </Row>
          </Card>
        </Form>
      </Content>
    </Layout>
  );
};

export default App;