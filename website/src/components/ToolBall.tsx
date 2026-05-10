import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Popover, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useBattleStore } from '../stores/battleStore';

const DEFAULT_POSITION = { x: window.innerWidth - 80, y: window.innerHeight - 200 };
const HIDE_DELAY = 300; // 鼠标离开后延迟隐藏，给移动到菜单的时间

const ToolBall: React.FC = () => {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const isOverPopover = useRef(false);

  // 加载保存的位置
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.loadBallPosition().then((pos) => {
      if (pos) setPosition(pos);
    });
  }, []);

  // 显示菜单 — 取消隐藏计时器
  const showMenu = useCallback(() => {
    if (isDragging) return;
    clearTimeout(hideTimer.current);
    setMenuVisible(true);
  }, [isDragging]);

  // 延迟隐藏 — 给鼠标移动到菜单的时间
  const hideMenu = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      // 如果鼠标已经在 popover 上，不关
      if (!isOverPopover.current) {
        setMenuVisible(false);
      }
    }, HIDE_DELAY);
  }, []);

  const dismissMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // 拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuVisible(false);
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
        window.electronAPI?.saveBallPosition(position);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, position]);

  // 识别阵容
  const handleRecognize = async () => {
    if (!window.electronAPI) {
      message.warning('识别功能仅在桌面应用中可用');
      return;
    }
    dismissMenu();
    setIsRecognizing(true);
    const result = await window.electronAPI.recognizeTeams();
    setIsRecognizing(false);

    if (!result.success) {
      message.error(result.message);
      return;
    }

    useBattleStore.getState().patchState(result.patch);
    const p = result.patch;
    message.success(
      `识别完成！玩家1: ${p.team1?.length ?? 0}只，玩家2: ${p.team2?.length ?? 0}只`,
    );
  };

  const popoverContent = (
    <div
      onMouseEnter={() => { isOverPopover.current = true; clearTimeout(hideTimer.current); }}
      onMouseLeave={() => { isOverPopover.current = false; dismissMenu(); }}
    >
      <Button
        type="text"
        icon={<CameraOutlined />}
        onClick={handleRecognize}
        loading={isRecognizing}
        style={{ width: '100%', textAlign: 'left' }}
      >
        识别双方阵容
      </Button>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={showMenu}
      onMouseLeave={hideMenu}
    >
      <Popover
        content={popoverContent}
        open={menuVisible}
        placement="left"
        overlayStyle={{ pointerEvents: 'auto' }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 6px 16px rgba(24, 144, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 4px 12px rgba(24, 144, 255, 0.4)';
          }}
        >
          <CameraOutlined style={{ fontSize: 20, color: '#fff' }} />
        </div>
      </Popover>
    </div>
  );
};

export default ToolBall;
