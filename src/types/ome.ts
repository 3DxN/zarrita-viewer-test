export interface IStringAny {
  [key: string]: any;
}

export default interface OMEAttrs extends IStringAny {
  multiscales?: OMEMultiscales[];
  plate?: OMEPlate;
  well?: OMEWellMetadata;
}

export interface OMEMultiscales extends IStringAny {
  axes: OMEAxes[];
  datasets: OMEdataset[];
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

export interface OMEPlate extends IStringAny {
  acquisitions?: OMEAcquisition[];
  columns: OMEColumn[];
  rows: OMERow[];
  wells: OMEWell[];
  field_count?: number;
  name?: string;
  version?: string;
}

export interface OMEAcquisition extends IStringAny {
  id: number;
  name?: string;
  maximumfieldcount?: number;
}

export interface OMEColumn extends IStringAny {
  name: string;
}

export interface OMERow extends IStringAny {
  name: string;
}

export interface OMEWell extends IStringAny {
  path: string;
  rowIndex: number;
  columnIndex: number;
}

export interface OMEWellMetadata extends IStringAny {
  images: OMEWellImage[];
  version?: string;
}

export interface OMEWellImage extends IStringAny {
  path: string;
}