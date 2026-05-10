// Pipeline JSON 动态生成：只有一个 Custom 识别节点
export function buildTeamRecognitionPipeline(): Record<string, unknown> {
  return {
    RecognizeTeams: {
      recognition: 'Custom',
      custom_recognition: 'recognize_teams',
      action: 'DoNothing',
    },
  };
}
