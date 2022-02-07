export interface RequestPropsI<T,U> {
    urlCtr: string;
    urlTarget?: string;
    urlSearch?: string;
    delay?:number;
    needError?:boolean;
    mockRequest:U,
    body?:T
};