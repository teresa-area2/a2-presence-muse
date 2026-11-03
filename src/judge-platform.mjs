// This is a preflight boundary, not a claim that either allowed OS is qualified.
export const JUDGE_NODE_REQUIREMENT='>=22.12.0 <23.0.0 || >=24.1.0 <25.0.0';

export function supportsJudgeNode(version=process.versions.node){
  const match=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(String(version??''));
  if(!match)return false;
  const [major,minor,patch]=match.slice(1).map(Number);
  return [major,minor,patch].every(Number.isSafeInteger)&&((major===22&&minor>=12)||(major===24&&minor>=1));
}

export function assertJudgeNode(version=process.versions.node){
  if(!supportsJudgeNode(version))throw Error('judge_node_version_required');
}

export function judgePlatform(platform = process.platform) {
  if (platform === 'darwin' || platform === 'linux') return {allowed: true, code: null};
  if (platform === 'win32') return {allowed: false, code: 'judge_install_process_group_unavailable'};
  return {allowed: false, code: 'judge_platform_unsupported'};
}

export function assertJudgePlatform(platform = process.platform) {
  const result = judgePlatform(platform);
  if (!result.allowed) throw Error(result.code);
}

export function judgePlatformMessage(error, platform = process.platform) {
  if(error?.message==='judge_node_version_required')return 'Use Node 22.12+ within22 or Node 24.1+ within24. On macOS, sh scripts/judge-mac.sh install can select a project-local runtime without changing your global Node.';
  if (platform === 'win32' && error?.message === 'judge_install_process_group_unavailable') return 'Native Windows is not supported. Use WSL2 and follow docs/JUDGE-QUICKSTART.md.';
  if (error?.message === 'judge_platform_unsupported') return 'This operating system is not supported. Use macOS or Linux; Windows users can use WSL2. See docs/JUDGE-QUICKSTART.md.';
  return null;
}
