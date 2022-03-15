export interface RequestPropsI<T, U> {
  urlCtr: string;
  urlTarget?: string;
  urlSearch?: string;
  delay?: number;
  needError?: boolean;
  mockRequest: U;
  body?: T;
}
export interface MockRequestI {
  mockResponse: any;
  useFile: boolean;
  chunkLength: number;
  stopAll: boolean;
  delay: number;
  limit: number;
}
