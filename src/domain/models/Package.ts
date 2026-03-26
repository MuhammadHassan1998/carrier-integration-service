import { WeightUnit, DimensionUnit } from '../types';

export interface Package {
  weight: number;
  weightUnit: WeightUnit;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: DimensionUnit;
}
