export interface IStringAny {
  [key: string]: any;
}

export default interface OMEAttrs extends IStringAny {
  multiscales: OMEMultiscales[];
  [string: string]: any; // Allow additional properties
}

export interface OMEMultiscales extends IStringAny {
  axes: OMEAxes[];
  datasets: OMEdataset[];
  [string: string]: any; // Allow additional properties
}

export interface OMEAxes extends IStringAny {
  name: string;
  type: string;
}

export interface OMEdataset extends IStringAny {
  path: string;
  coordinateTransformations: OMECoordinateTransformation[];
}

export interface OMECoordinateTransformation extends IStringAny {
  scale: number[];
  type: string;
}