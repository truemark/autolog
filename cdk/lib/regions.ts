export const SupportedRegions = {
  'us-east-1': 'Virginia',
  'us-east-2': 'Ohio',
  'us-west-2': 'Oregon',
  'af-south-1': 'CapeTown',
  'ap-northeast-2': 'Seoul',
  'ap-southeast-1': 'Singapore',
  'eu-west-1': 'Ireland',
};

export function isSupportedRegion(region: string): boolean {
  return Object.keys(SupportedRegions).includes(region);
}

export function getRegionName(region: string): string | null {
  if (Object.keys(SupportedRegions).includes(region)) {
    return SupportedRegions[region as keyof typeof SupportedRegions];
  }
  return null;
}
