import buffsConfig from '../config/buffs.json';

// 根据配置生成默认的增益减益对象
export const createDefaultBuff = () => {
  const buff = {};
  buffsConfig.forEach((b) => {
    buff[b.key] = b.default;
  });
  return buff;
};

// 清空增益减益为默认值
export const resetBuff = () => {
  const buff = {};
  buffsConfig.forEach((item) => {
    buff[item.key] = item.default;
  });
  return buff;
};