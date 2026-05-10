import buffsConfig from '../config/buffs.json';
import type { Buff, BuffConfigItem } from '../types';

// 根据配置生成默认的增益减益对象
export const createDefaultBuff = (): Buff => {
  const buff: Buff = {};
  (buffsConfig as BuffConfigItem[]).forEach((b) => {
    buff[b.key] = b.default;
  });
  return buff;
};

// 清空增益减益为默认值
export const resetBuff = (): Buff => {
  const buff: Buff = {};
  (buffsConfig as BuffConfigItem[]).forEach((item) => {
    buff[item.key] = item.default;
  });
  return buff;
};