// 深层合并工具：递归合并两个对象/数组
// - 两个对象 → 递归合并键
// - 两个数组 → 按索引合并元素，patch 多余的忽略，original 多余的保留
// - 其他（基本类型 / patch 非对象 / original 非对象）→ patch 直接覆盖

type DeepMergeable = Record<string, unknown> | unknown[];

export function deepMerge<T extends DeepMergeable>(original: T, patch: T): T {
  // 数组：按索引合并
  if (Array.isArray(original) && Array.isArray(patch)) {
    const result = [...original] as unknown[];
    for (let i = 0; i < patch.length; i++) {
      if (i < result.length) {
        result[i] = deepMerge(result[i] as DeepMergeable, patch[i] as DeepMergeable);
      } else {
        result.push(patch[i]);
      }
    }
    return result as T;
  }

  // 对象：递归合并
  if (isPlainObject(original) && isPlainObject(patch)) {
    const result = { ...original } as Record<string, unknown>;
    for (const key of Object.keys(patch)) {
      if (key in result) {
        result[key] = deepMerge(
          result[key] as DeepMergeable,
          (patch as Record<string, unknown>)[key] as DeepMergeable,
        );
      } else {
        result[key] = (patch as Record<string, unknown>)[key];
      }
    }
    return result as T;
  }

  // 基本类型 / 类型不一致 → 覆盖
  return patch;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
