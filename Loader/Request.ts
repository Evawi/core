import { RequestPropsI } from './Interface';
import { FetchClass } from './Fetch';

export class Request {
  static async get<BodyT, MockT>(requestProps: RequestPropsI<BodyT, MockT>): Promise<MockT> {
    const method: string = 'GET';
    const resp = new FetchClass();
    const response = await resp.fetch<BodyT, MockT>(requestProps, method);
    return response;
  }

  static async post<BodyT, MockT>(requestProps: RequestPropsI<BodyT, MockT>): Promise<MockT> {
    const method: string = 'POST';
    const resp = new FetchClass();
    const response = await resp.fetch<BodyT, MockT>(requestProps, method);
    return response;
  }
}
